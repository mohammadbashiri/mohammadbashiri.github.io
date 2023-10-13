From mcr.microsoft.com/devcontainers/python:1-3.8-bullseye

RUN pip install --upgrade pip

# install the essentials
COPY .devcontainer/dev_requirements.txt /usr/src
RUN pip install -r /usr/src/dev_requirements.txt

# install the user-specific packages
COPY requirements.txt /usr/src
RUN pip install -r /usr/src/requirements.txt
