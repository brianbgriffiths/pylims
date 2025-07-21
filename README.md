# pylims

to start:
source /home/dev/pylims/pylims-venv/bin/activate
cd /home/dev/pylims/src
daphne -b 0.0.0.0 -p 8000 settings.asgi:application