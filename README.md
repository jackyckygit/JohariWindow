# JohariWindow

# Building
docker build --build-arg PUBLIC_URL="/jw" -t johari_wndow:0.2 .

# Running
docker run -d --net=host --name johari-window --restart=always johari_wndow:0.2 npm start