# JohariWindow

docker build --build-arg PUBLIC_URL="/jw" -t johari_wndow:0.1 .
docker run -d --net=host --name johari-window --restart=always johari_wndow:0.1 npm start