#!/usr/bin/env python

from flask import Flask, jsonify, render_template, request, session
from flask_redis import Redis
from flask_oauthlib.client import OAuth
from functools import wraps
import re
import subprocess

app = Flask(__name__)
app.config.from_object('config')
redis_store = Redis(app)
redis_key = app.config['REDIS_KEY']
if app.config.get('REPROVISION_CMD'):
    reprovision_command = app.config['REPROVISION_CMD']
else:
    reprovision_command = ['/bin/echo']

app.secret_key = app.config.get('SECRET_KEY')


def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not is_authorised():
            return jsonify(error="You are not authorized"), 403
        return f(*args, **kwargs)
    return decorated_function


@app.route('/')
def main():
    wikis = get_wikis()
    return render_template(
        'index.html',
        extrawikis=wikis,
        software_version=get_version(),
        is_authorised=is_authorised()
    )


@app.route('/api/wikis', methods=['GET'])
def wikis_get():
    return jsonify(wikis=get_wikis(), version=get_version())


@app.route('/api/wikis/edit', methods=['POST'])
@auth_required
def change_wikis():
    add_wikis = []
    delete_wikis = []
    if request.form.get('add'):
        add_wikis = request.form['add'].split('|')
        add_wikis = filter(validate_wiki, add_wikis)
        if len(add_wikis):
            redis_store.sadd(redis_key, *add_wikis)
    if request.form.get('delete'):
        delete_wikis = request.form['delete'].split('|')
        if len(delete_wikis):
            redis_store.srem(redis_key, *delete_wikis)
    subprocess.Popen(reprovision_command)
    return jsonify(added=add_wikis, deleted=delete_wikis)


@app.route('/api/wikis/update', methods=['POST'])
@auth_required
def update():
    try:
        subprocess.check_call(
            app.config['UPDATE_CMD'],
            cwd=app.config['GIT_DIR']
        )
    except subprocess.CalledProcessError as e:
        return jsonify(updated=False, error=str(e))
    return jsonify(updated=True, version=get_version())


def get_wikis():
    return [var for var in redis_store.smembers(redis_key)]


def get_version():
    return subprocess.check_output(
        app.config['VERSION_CMD'],
        cwd=app.config['GIT_DIR']
    )


def validate_wiki(wiki):
    return re.match('^[a-z][a-z0-9_-]{0,15}$', wiki)

# Login
oauth = OAuth(app)
mw_base = app.config.get('MEDIAWIKI_BASE')
mediawiki = oauth.remote_app(
    'mediawiki.org',
    consumer_key=app.config.get('OAUTH_CONSUMER_TOKEN'),
    consumer_secret=app.config.get('OAUTH_CONSUMER_SECRET'),
    request_token_params={
        'title': 'Special:OAuth/initiate',
        'oauth_callback': 'oob'
    },
    access_token_url=mw_base+'/w/index.php?title=Special:OAuth/token',
    authorize_url=mw_base+'/wiki/Special:OAuth/authorize',
    request_token_url=mw_base+'/w/index.php',
    base_url=mw_base+'/w/index.php',
)


@app.route('/login')
def login():
    return mediawiki.authorize(
        callback=url_for('oauth-callback'),
        _external=true
    )


@app.route('/oauth-callback')
def oauth_callback():
    resp = oauth.authorized_response()
    if resp is not None:
        session['authorized'] = True
    return redirect(url_for('main'))


def is_authorised():
    return 'authorized' in session


@mediawiki.tokengetter
def get_token():
    return session.get('mediawiki_token')


if __name__ == "__main__":
    app.run(host='0.0.0.0', threaded=True)
