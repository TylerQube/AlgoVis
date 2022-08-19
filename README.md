# AlgoVision
[Deployed Project](https://algo-vision.herokuapp.com).

A straightforward webpage for understanding and visualizing basic pathfinding algorithms!  

Users create a maze of varying dimensions and terrain, and then observe the step by step computation of an optimal path using a variety of algorithms.

I built AlgoVision as an exercise in implementing pathfinding algorithms in Typescript.

# Features
AlgoVision provides an intuitive drag/drop GUI to create a maze of tiles of varying "terrain difficulty" directly proportional to the "cost" of moving through the tile.   

After constructing a maze and placing a start and goal on separate tiles, the user can select an algorithm between:  
- Greedy Pathfinding
- Dijkstra's Algorithm
- A* (A Star)

Pause/play buttons as well as single-step forward/back buttons allow for completel control over playback of the pathfinding process.


# Running locally
After cloning the repository to your local machine, run the following commands to build the minified javascript and serve the webpage locally

```
npm install
npm run build
npm run start
```
