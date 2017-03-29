const THREE = require('three');
const Random = require("random-js");
const Ease = require("ease-component")
	
import Framework from './framework'

class Engine
{
	constructor()
	{
		this.map = new Map();
	}

	initialize(scene)
	{
		this.map.initializeAgents(100, scene);
		this.initializeScene(scene);
	}

	initializeScene(scene)
	{
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
		mesh.position.set(-this.map.width * .5, 0, -this.map.height*.5);
		scene.add( mesh );
	}

	update(deltaTime)
	{
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

			var agent = new Agent(mesh);
			this.agents.push(agent);			
		}
	}

	getCellIndex(position)
	{
		var x = Math.floor(position.x);
		var y = Math.floor(position.y);

		return y * this.width + x;
	}

	update(deltaTime)
	{
		this.updateMarkers();

		// Update our agent data structure
		for(var a = 0; a < this.agents.length; a++)
		{
			var agent = this.agents[a];
			agent.update(deltaTime);

			var p = agent.position;
			var currentIndex = this.getCellIndex(p);

			if(agent.currentCellIndex != currentIndex || agent.currentCellIndex == -1)
			{
				if(agent.currentCellIndex != -1)
					this.grid[agent.currentCellIndex].splice(agent, 1);

				this.grid[currentIndex].push(agent);

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

		var minDistance = this.width * this.height * 100;
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
						var length = position.distanceTo(agent.position);

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
	constructor(mesh)
	{
		this.mesh = mesh;
		this.position = new THREE.Vector2();
		this.velocity = new THREE.Vector2();
		this.target = new THREE.Vector2();
		this.toTarget = new THREE.Vector2();
		this.orientation = new THREE.Vector2();
		this.radius = 1.0;
		this.currentContribution = new THREE.Vector2();
		this.currentCellIndex = -1;
	}

	cleanMarkerContribution()
	{
		this.velocity = new THREE.Vector2();
	}

	assignMarker(markerPosition)
	{
		var toMarker = markerPosition.clone().sub(this.position);
		var distance = toMarker.length();

		toMarker.normalize();
		var weight = toMarker.dot(this.toTarget);
	}

	update(deltaTime)
	{
		// Update position
		this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
		// Get adjacent agents, check markers etc
		// Update velocity based on markers
		// Update mesh positions etc

		this.toTarget = this.target.clone().sub(this.position);
		this.toTarget.normalize();

		// Clean for next update
		this.cleanMarkerContribution();
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


  // // initialize a simple box and material
  // var directionalLight = new THREE.DirectionalLight( 0xffffff, 1 );
  // directionalLight.color = new THREE.Color(.9, .9, 1 );
  // directionalLight.position.set(-10, 10, 10);
  // scene.add(directionalLight);

  // // initialize a simple box and material
  // var directionalLight2 = new THREE.DirectionalLight( 0xffffff, 1 );
  // directionalLight2.color = new THREE.Color(.4, .4, .7);
  // directionalLight2.position.set(-1, -3, 2);
  // directionalLight2.position.multiplyScalar(10);
  // scene.add(directionalLight2);

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
		// engine.update(1);
		
	}
}

Framework.init(onLoad, onUpdate, onResize);
