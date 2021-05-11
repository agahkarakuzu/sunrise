FROM jupyter/base-notebook:016833b15ceb

USER root

ENV DEBIAN_FRONTEND=noninteractive
# Install apt dependencies
ARG DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Moscow
COPY apt.txt /tmp/
RUN apt-get update && \
    apt-get -y install tzdata && \
    cat /tmp/apt.txt | xargs sudo apt-get install -y --no-install-recommends &&\
    apt-get clean && \
    apt-get autoremove && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

COPY requirements.txt /tmp/
RUN echo ${TAG};\
    pip install --upgrade pip; \
    pip install --requirement /tmp/requirements.txt; \
    cd $HOME/work; \    
    git clone --depth 1 https://github.com/agahkarakuzu/sunrise.git;\
    chmod -R 777 $HOME/work/sunrise
COPY . /tmp/

WORKDIR $HOME/work

USER $NB_UID
