const THREE = require('three');
const Random = require("random-js");
const Ease = require("ease-component")
	
import Framework from './framework'

class Engine
{
	constructor()
	{
		this.map = new Map();
		this.time = 0.0;
		this.clock = new THREE.Clock();
	}

	initialize(scene)
	{
		var container = new THREE.Object3D();
		scene.add(container);

		this.map.initializeAgents(10, container);
		this.initializeScene(container);

		container.position.set(-this.map.width * .5, 0, -this.map.height*.5);
	}

	initializeScene(scene)
	{
		// Almost all of this is debug
		var geo = new THREE.Geometry();
		var cylinder = new THREE.CylinderGeometry( .02, .02, .05, 4 );
		var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );

		var markers = this.map.getMarkers();
		var matrix = new THREE.Matrix4();

		for(var m = 0; m < markers.length; m++)
		{
			var marker = markers[m];
			matrix.makeTranslation(marker.x, 0, marker.y);
			geo.merge(cylinder, matrix);
		}

		var mesh = new THREE.Mesh( geo, material );
		scene.add( mesh );

		var lineGeo = new THREE.Geometry();

		for(var x = 0; x <= this.map.width; x++)
		{
			lineGeo.vertices.push(new THREE.Vector3( x, 0, 0 ));
			lineGeo.vertices.push(new THREE.Vector3( x, 0, this.map.height ));
		}

		for(var x = 0; x <= this.map.width; x++)
		{
			lineGeo.vertices.push(new THREE.Vector3( 0, 0, x ));
			lineGeo.vertices.push(new THREE.Vector3( this.map.width, 0, x ));
		}

		var lineMaterial = new THREE.LineBasicMaterial({ color: 0x888888 });
		lineMaterial.linewidth = 2;
		var lineMesh = new THREE.LineSegments(lineGeo, lineMaterial);

		scene.add(lineMesh);

	}

	update()
	{
	 	var deltaTime = this.clock.getDelta();
	 	this.time += deltaTime;
		this.map.update(deltaTime)
	}
}

class Map
{
	constructor()
	{
		this.grid = []
		this.width = 32;
		this.height = 32;
		this.agents = []; // The raw array
		this.generator = Random.engines.mt19937();
		// TODO: obstacle map

		for(var i = 0; i < this.width * this.height; i++)
			this.grid.push(new Array());
	}

	initializeAgents(agentCount, scene)
	{
		var cylinder = new THREE.CylinderBufferGeometry( .1, .1, .2, 16 );
		var material = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

		for(var i = 0; i < agentCount; i++)
		{
			var mesh = new THREE.Mesh( cylinder, material );
			scene.add( mesh );

			var agent = new Agent(mesh, new THREE.Vector2( i * this.width / agentCount, .5 ), new THREE.Vector2( this.width, this.height ));
			this.agents.push(agent);			
		}
	}

	getCellIndex(position)
	{
		var x = Math.floor(position.x);
		var y = Math.floor(position.y);

		var index = y * this.width + x;

		if(index >= 0 && index < this.width * this.height)
			return index;

		return -1;
	}

	update(deltaTime)
	{
		// Update our agent data structure
		for(var a = 0; a < this.agents.length; a++)
			var agent = this.agents[a].cleanMarkerContribution();
		
		this.updateMarkers();

		// Update our agent data structure
		for(var a = 0; a < this.agents.length; a++)
		{
			var agent = this.agents[a];
			agent.update(deltaTime);

			var p = agent.position;
			var currentIndex = this.getCellIndex(p);

			if(agent.currentCellIndex != currentIndex)
			{
				if(agent.currentCellIndex != -1)
					this.grid[agent.currentCellIndex].splice(agent, 1);

				if(currentIndex != -1)
					this.grid[currentIndex].push(agent);

				// console.log("Moved from " + agent.currentCellIndex + " to " + currentIndex);
				agent.currentCellIndex = currentIndex;

			}
		}
	}

	// Just for specific cases!
	getMarkers()
	{
		var markerDensity = 8; // The amount of markers per cell
		var markers = [];

		for(var x = 0; x < this.width; x++)
		{
			for(var y = 0; y < this.height; y++)
			{
				var seed = y * this.width + x;
				this.generator.seed(seed);

				var r = new Random(this.generator);

				for(var s = 0; s < markerDensity; s++)
				{
					var u = r.real(0, 1, true);
					var v = r.real(0, 1, true);
					markers.push(new THREE.Vector2(x + u, y + v));
				}	
			}
		}

		return markers;
	}

	// Because the markers can be evaluated in runtime,
	// my approach is memory lightweight (although there is a performance impact)
	// TODO: only iterate markers on occupied cells (and their adjacent cells)
	updateMarkers()
	{
		var markerDensity = 8; // The amount of markers per cell

		for(var x = 0; x < this.width; x++)
		{
			for(var y = 0; y < this.height; y++)
			{
				var seed = y * this.width + x;
				this.generator.seed(seed);

				var r = new Random(this.generator);

				for(var s = 0; s < markerDensity; s++)
				{
					var u = r.real(0, 1, true);
					var v = r.real(0, 1, true);

					var marker = new THREE.Vector2(x + u, y + v);
					var agent = this.getNearestAgent(marker);

					if(agent != null)
						agent.assignMarker(marker);
				}	
			}
		}
	}

	getNearestAgent(position)
	{
		var offsetX = Math.floor(position.x);
		var offsetY = Math.floor(position.y);

		var minDistance = this.width * this.height * 10000;
		var minAgent = null;

		// Average case is O(1), although if all the agents are in the same
		// cell, it degenerates to O(n)... if we expect this, we can use a 
		// quad tree per cell
		for(var x = -1; x <= 1; x++)
		{
			for(var y = -1; y <= 1; y++)
			{
				var cellX = offsetX + x;
				var cellY = offsetY + y;

				if(cellX >= 0 && cellX < this.width && cellY >= 0 && cellY < this.height)
				{
					var index = cellY * this.width + cellX;
					var cellAgents = this.grid[index];

					for(var a = 0; a < cellAgents.length; a++)
					{
						var agent = cellAgents[a];
						var length = Math.max(0, position.distanceTo(agent.position) - agent.radius);

						if(length < minDistance || minAgent == null)
						{
							minDistance = length;
							minAgent = agent;
						}
					}
				}
			}
		}

		return agent;
	}
}

class Agent
{
	constructor(mesh, startPosition, target)
	{
		this.mesh = mesh;
		this.position = startPosition;
		this.maxSpeed = 1.0;
		this.velocity = new THREE.Vector2(1,0);
		this.target = target;
		this.orientation = new THREE.Vector2();
		this.radius = 1.0;
		this.currentContribution = new THREE.Vector2();
		this.currentCellIndex = -1;

		this.toTarget = startPosition.clone().sub(target);
		this.toTarget.normalize();

		this.lineGeo = new THREE.Geometry();
		this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
		this.lineMesh = new THREE.Line(this.lineGeo, this.lineMaterial);

		this.mesh.add(this.lineMesh);
	}

	cleanMarkerContribution()
	{
		this.velocity = new THREE.Vector2(0, 0);


		this.mesh.remove(this.lineMesh);
		this.lineGeo = new THREE.Geometry();
		this.lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
		this.lineMesh = new THREE.Line(this.lineGeo, this.lineMaterial);

		this.mesh.add(this.lineMesh);
	}

	assignMarker(markerPosition)
	{
		var toMarker = markerPosition.clone().sub(this.position);
		var distance = Math.max(0, toMarker.length() - this.radius);

		this.lineGeo.vertices.push(new THREE.Vector3());
		this.lineGeo.vertices.push(new THREE.Vector3(toMarker.x, 0, toMarker.y));

		toMarker.normalize();
		var weight = toMarker.dot(this.toTarget) * .5 + .5;

		var distanceFalloff = Math.max(1.0 - distance);

		this.velocity.add(toMarker.clone().multiplyScalar(weight * distanceFalloff));

	}

	update(deltaTime)
	{
		// Clamp velocity
		var currentSpeed = this.velocity.length();
		currentSpeed = Math.min(currentSpeed, this.maxSpeed);


		this.velocity.normalize();
		this.velocity.multiplyScalar(currentSpeed);

		// Update position
		this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
		// Get adjacent agents, check markers etc
		// Update velocity based on markers
		// Update mesh positions etc

		this.toTarget = this.target.clone().sub(this.position);
		this.toTarget.normalize();

		this.mesh.position.set(this.position.x, 0, this.position.y);
		this.mesh.material.color = (this.currentCellIndex == -1) ? new THREE.Color(0xff0000) : new THREE.Color( 0x0000ff );
	}
}

var engine = null;

function onLoad(framework) 
{
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  engine = new Engine();
  engine.initialize(scene);

  // set camera position
  camera.position.set(20, 20, 20);
  camera.lookAt(new THREE.Vector3(0,0,0));
  camera.fov = 35;
  camera.updateProjectionMatrix();
}

function onResize(framework)
{
}

// called on frame updates
function onUpdate(framework) 
{

	if(engine != null)
	{
		engine.update();		
	}
}

Framework.init(onLoad, onUpdate, onResize);
