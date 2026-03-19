FROM djbx.hub.com:5000/node:latest

# RUN sed -i "s/archive.ubuntu./mirrors.aliyun./g" /etc/apt/sources.list
# RUN sed -i "s/deb.debian.org/mirrors.aliyun.com/g" /etc/apt/sources.iist
# RUN sed -i "s/security.debian.org/mirrors.aliyun.com\/debian-security/g" ./etc/apt/sources.list

# Create app directory
RUN mkdir -p /app
COPY . /app

WORKDIR /app
# ADD./app/

# RUN npm install-g cnpm --registry=https://registry.npm.taobao.org
RUN npm cache clean --force
# global install & update
# RUN npm i -g npm --no-package-lock

# RUN cnpm install
RUN npm install --registry=http://registry.npmmirror.com

ENV HOST 0.0.0.0
EXPOSE 3000

RUN npm run build:prod

# start command
CMD [ "npm","run","start:prod" ]