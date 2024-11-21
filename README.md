# JohariWindow

# Building
docker build --build-arg PUBLIC_URL="/jw" -t johari_wndow:0.3 .

# Running
docker run -d --net=host --name johari-window --restart=always johari_wndow:0.3 npm start

# special case handling
issue with changing group
case 1: user "A" and "B" belong to group "A", user "A" assessed user "B", then user "A" changed to  group "B".
case 2: user "A" and "B" belong to group "A", user "A" assessed user "B", then user "B" changed to  group "B".
solution: when getting the users, will filter out the assessment which are coming from users not in the same group