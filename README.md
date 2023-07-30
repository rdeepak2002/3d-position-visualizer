# 3d-position-visualizer

## Requirements

- [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)

## Get Started

```shell
# clone repository
git clone https://github.com/rdeepak2002/3d-position-visualizer.git
cd 3d-position-visualizer

# install dependencies
yarn

# start server
yarn start
```

Visit ``http://localhost:8081``

## Test Socket Server

Visit [https://www.piesocket.com/socketio-tester](https://www.piesocket.com/socketio-tester)

Connect to ``http://localhost:8081``

Set ``event`` to ``device-1``

Set ``data`` to ``{"Position":{"x":35.6590945,"y":139.6999859,"z":21},"Orientation":{"x":0,"y":0,"z":0,"w":1},"Confidence":"dummy_value"}``

