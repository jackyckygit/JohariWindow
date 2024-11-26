# JohariWindow

The Johari Window is a psychological tool created by Joseph Luft and Harrington Ingham in 1955. It's designed to help people understand their relationships with themselves and others. The model is represented as a grid with four quadrants, each representing different aspects of self-awareness and mutual understanding.

### The Four Quadrants:

1. **Open Area (Arena)**:
   - **Known to Self and Known to Others**: This area includes information, behaviors, attitudes, feelings, and skills that you and others are aware of. Effective communication and open feedback can expand this area, promoting better relationships and trust.

2. **Blind Area (Blind Spot)**:
   - **Unknown to Self but Known to Others**: This quadrant contains things about you that others see but you are unaware of. Feedback from others can help you uncover these blind spots, increasing your self-awareness.

3. **Hidden Area (Façade)**:
   - **Known to Self but Unknown to Others**: This area includes things you know about yourself but keep hidden from others, such as personal fears, insecurities, or secrets. Sharing more about yourself can reduce the hidden area and build stronger connections.

4. **Unknown Area**:
   - **Unknown to Self and Unknown to Others**: This quadrant consists of undiscovered aspects of yourself, such as untapped talents or unconscious behaviors. Through self-discovery and new experiences, you can uncover elements of this unknown area.

### How It Works:
The Johari Window can be used in various settings, such as personal development, team building, and therapy. By soliciting feedback from others and sharing information about yourself, you can expand the Open Area, leading to improved communication and stronger relationships.

### Visual Representation:
```
           | Known to Self       | Unknown to Self
-----------|---------------------|-----------------
Known to   | Open Area           | Blind Area
Others     | (Arena)             | (Blind Spot)
-----------|---------------------|-----------------
Unknown to | Hidden Area         | Unknown Area
Others     | (Façade)            | (Unknown)
```

The Johari Window is a powerful tool for fostering self-awareness, enhancing interpersonal communication, and building trust within teams. By actively engaging in the process of giving and receiving feedback, individuals and groups can achieve greater mutual understanding and collaboration.

This is a web application written in **React** and **Node.js**

## Building
```bash
docker build --build-arg PUBLIC_URL="/jw" -t johari_wndow:$VERSION_NUM .
```

## Running
```bash
docker run -d --net=host --name johari-window --restart=always johari_wndow:$VERSION_NUM npm start
```

# Special case handling
## Issue with changing group
- **case 1:** user "A" and "B" belong to group "A", user "A" assessed user "B", then user "A" changed to  group "B".
- **case 2:** user "A" and "B" belong to group "A", user "A" assessed user "B", then user "B" changed to  group "B".

when getting the users, added a flag to filter out the assessment which are coming from users not in the same group