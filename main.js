/* ===========================
   APP DATA
=========================== */

const apps = [

{
id:"music",
name:"Music",
icon:"music",
color:"#8e44ad",
render:()=>`
<div class="music-ui">

<div class="album"></div>

<h2>Origin Track</h2>

<button class="play-btn">Play</button>

</div>
`
},

{
id:"photos",
name:"Photos",
icon:"image",
color:"#e67e22",
render:()=>`<h1>Gallery</h1>`
},

{
id:"browser",
name:"Browser",
icon:"globe",
color:"#3498db",
render:()=>`<iframe src="https://example.com" style="flex:1;border:none;"></iframe>`
}

]

/* ===========================
   DOM
=========================== */

const grid = document.getElementById("apps-grid")
const dockIcons = document.getElementById("dock-icons")
const container = document.getElementById("app-container")

/* ===========================
   RENDER APPS
=========================== */

apps.forEach(app=>{

const el = document.createElement("div")

el.className="app-icon"

el.innerHTML=`

<div class="icon-box" style="background:${app.color}">
<i data-lucide="${app.icon}"></i>
</div>

<span>${app.name}</span>

`

grid.appendChild(el)

el.addEventListener("click",()=>openApp(el,app))

})

lucide.createIcons()

/* ===========================
   APP OPEN (GSAP FLIP)
=========================== */

let currentApp=null

function openApp(icon,app){

const state = Flip.getState(icon)

const win = document.createElement("div")

win.className="app-window"

win.style.background=app.color

win.innerHTML=app.render()

container.appendChild(win)

Flip.from(state,{
duration:0.7,
ease:"expo.out",
absolute:true
})

container.style.pointerEvents="auto"

currentApp=win

}

/* ===========================
   HOME BAR CLOSE
=========================== */

const homeBar=document.getElementById("home-bar")

homeBar.addEventListener("click",closeApp)

function closeApp(){

if(!currentApp) return

gsap.to(currentApp,{

y:500,
scale:0.7,
duration:0.6,
ease:"elastic.out",

onComplete:()=>{

currentApp.remove()
container.style.pointerEvents="none"
currentApp=null

}

})

}

/* ===========================
   PARALLAX WALLPAPER
=========================== */

const wallpaper=document.getElementById("wallpaper")

document.addEventListener("mousemove",e=>{

const x=(e.clientX/window.innerWidth-0.5)*30
const y=(e.clientY/window.innerHeight-0.5)*30

gsap.to(wallpaper,{
x,
y,
duration:0.6,
ease:"power3.out"
})

})

/* ===========================
   ICON PRESS PHYSICS
=========================== */

document.querySelectorAll(".app-icon").forEach(icon=>{

icon.addEventListener("mousedown",()=>{

gsap.to(icon,{
scale:0.85,
duration:0.1
})

})

icon.addEventListener("mouseup",()=>{

gsap.to(icon,{
scale:1,
duration:0.4,
ease:"elastic.out"
})

})

})

/* ===========================
   LIQUID GLASS SHADER
=========================== */

const canvas=document.getElementById("liquid-canvas")

const renderer = new ogl.Renderer({canvas})

const gl=renderer.gl

const camera = new ogl.Camera(gl)

camera.position.z=1

const scene=new ogl.Transform()

const geometry=new ogl.Triangle(gl)

/* Fragment shader creates metaballs */

const program = new ogl.Program(gl,{

vertex:`
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main(){
vUv=uv;
gl_Position=vec4(position,0,1);
}
`,

fragment:`

precision highp float;

varying vec2 vUv;

vec2 balls[3];

float metaball(vec2 uv, vec2 center){

float d=distance(uv,center);

return 0.02/(d*d);

}

void main(){

balls[0]=vec2(0.3,0.5);
balls[1]=vec2(0.5,0.5);
balls[2]=vec2(0.7,0.5);

float field=0.0;

for(int i=0;i<3;i++){

field+=metaball(vUv,balls[i]);

}

/* alpha thresholding */

float alpha = field;

if(alpha>0.5){
alpha=1.0;
}else{
alpha=0.0;
}

gl_FragColor=vec4(1.0,1.0,1.0,alpha*0.15);

}

`

})

const mesh=new ogl.Mesh(gl,{geometry,program})

mesh.setParent(scene)

function update(){

renderer.render({scene,camera})

requestAnimationFrame(update)

}

update()