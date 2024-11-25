FROM node:22.10.0-slim

COPY . ./jw-server

# Install Tools
RUN apt-get update && apt-get install -y nano netcat-traditional locales procps && rm -rf /var/lib/apt/lists/*

# frontend
WORKDIR /jw-server/frontend
# Install Node Dependencies
RUN yarn install && yarn cache clean && npm uninstall -g yarn && npm cache clean --force

# build with webpack #arg can be provided by docker build cli or in the docker-compose yml file, it is used only during the build time
ARG PUBLIC_URL 
# this one just for checking the arg in the build env, not in the container
RUN echo $PUBLIC_URL
RUN env PUBLIC_URL=$PUBLIC_URL npm run build

# backend
WORKDIR /jw-server/backend
# Install Node Dependencies
RUN yarn install && yarn cache clean && npm uninstall -g yarn && npm cache clean --force


# Set the timezone. 
RUN ln -fs /usr/share/zoneinfo/Asia/Hong_Kong /etc/localtime
RUN dpkg-reconfigure -f noninteractive tzdata

# Set the locale
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    dpkg-reconfigure --frontend=noninteractive locales && \
    update-locale LANG=en_US.UTF-8
ENV LANG en_US.UTF-8 

CMD [ "/bin/bash" ]
