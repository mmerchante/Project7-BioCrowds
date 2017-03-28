const THREE = require('three');
const Random = require("random-js");
const Ease = require("ease-component")

import Framework from './framework'

class Map
{
	constructor()
	{
		this.grid = []
		this.width = 64;
		this.height = 64;
		// initialize the obstacle map
	}	

	updateAgents()
	{
		// Iterate agents, update grid
	}

	getAdjacentAgents(position)
	{
		// Check cells, return list
	}
}

class Agent
{
	constructor()
	{
		this.position = new THREE.Vector2();
		this.velocity = new THREE.Vector2();
		this.target = new THREE.Vector2();
		this.orientation = new THREE.Vector2();
		this.size = 1.0;
	}

	update(deltaTime)
	{
		// Update position
		// Get adjacent agents, check markers etc
		// Update velocity based on markers
		// Update mesh positions etc
	}
}

function onLoad(framework) 
{
  var scene = framework.scene;
  var camera = framework.camera;
  var renderer = framework.renderer;
  var gui = framework.gui;
  var stats = framework.stats;

  // // Init Engine stuff
  // Engine.scene = scene;
  // Engine.renderer = renderer;
  // Engine.clock = new THREE.Clock();
  // Engine.camera = camera;
  // Engine.currentPass = null;

  // Engine.glarePass = Glare.GlarePass(renderer, scene, camera);
  // Engine.sobelPass = Sobel.MainPass(renderer, scene, camera);
  // Engine.glitchPass = Glitch.MainPass(renderer, scene, camera);
  // Engine.passes.push(Engine.glarePass);
  // Engine.passes.push(Engine.sobelPass);
  // Engine.passes.push(Engine.glitchPass);

  // // Very important to set clear color alpha to 0, 
  // // so that effects can use that vaue as an additional parameter!
  // renderer.setClearColor(new THREE.Color(.4, .75, .95), 0);

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

  // // set camera position
  // camera.position.set(40, 40, 40);
  // camera.lookAt(new THREE.Vector3(0,0,0));
  // camera.fov = 5;
  // camera.far = 200;
  // camera.updateProjectionMatrix();

  // loadBackgrounds();
  // loadFakeBox();

  // Engine.rubik = new Rubik.Rubik();
  // var rubikMesh = Engine.rubik.build();

  // loadBuildings();
  // scene.add(rubikMesh);

  // Engine.random = new Random(Random.engines.mt19937().seed(14041956));


  // loadMusic();

  // loadCameraControllers();
}

function onResize(framework)
{
}

// called on frame updates
function onUpdate(framework) 
{
  // if(Engine.initialized)
  // {
  //   var screenSize = new THREE.Vector2( framework.renderer.getSize().width, framework.renderer.getSize().height );
  //   var aspectRatio = screenSize.y / screenSize.x;
  //   var deltaTime = Engine.clock.getDelta();

  //   Engine.time += deltaTime;
  //   Engine.cameraTime += deltaTime;
  //   Engine.deltaTime = deltaTime;

  //   Engine.rubik.update(deltaTime);

  //   // Update materials code
  //   for (var i = 0; i < Engine.materials.length; i++)
  //   {
  //     var material = Engine.materials[i];

  //     material.uniforms.time.value = Engine.time;

  //     if(material.uniforms["SCREEN_SIZE"] != null)
  //       material.uniforms.SCREEN_SIZE.value = screenSize;

  //     if(material.uniforms["ASPECT_RATIO"] != null)
  //       material.uniforms.ASPECT_RATIO.value = aspectRatio;
  //   }

  //   // Update passes code
  //   for (var i = 0; i < Engine.passes.length; i++)
  //   {
  //     var pass = Engine.passes[i];

  //     if(pass.uniforms["time"] != null)
  //       pass.uniforms.time.value = Engine.time;

  //     if(pass.uniforms["SCREEN_SIZE"] != null)
  //       pass.uniforms.SCREEN_SIZE.value = screenSize;

  //     if(pass.uniforms["ASPECT_RATIO"] != null)
  //       pass.uniforms.ASPECT_RATIO.value = aspectRatio;
  //   }

  //   updateCamera();

  //   if(Engine.currentPass != null)
  //     Engine.currentPass.render();
  //   else
  //     Engine.renderer.render(Engine.scene, Engine.camera);
  // }
}

Framework.init(onLoad, onUpdate, onResize);
