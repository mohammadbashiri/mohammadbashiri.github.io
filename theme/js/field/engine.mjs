// Physarum-inspired local sensing. No direct particle forces or learned policy.
export const WIDTH = 1024, HEIGHT = 1024, COUNT = 65536;
export const PRESETS = Object.freeze({
  networks: {name: 'Living networks', sensor: 17, angle: 0.6, turn: 0.40, speed: 1.25, decay: 0.965, diffusion: 0.8, deposit: 0.065, cross: 1},
  territories: {name: 'Three strangers', sensor: 22, angle: 0.75, turn: 0.48, speed: 1.15, decay: 0.972, diffusion: 0.7, deposit: 0.07, cross: -0.65},
  lace: {name: 'Electric lace', sensor: 9, angle: 0.8, turn: 0.65, speed: 1, decay: 0.94, diffusion: 0.6, deposit: 0.07, cross: 0.5},
  vesicles: {name: 'Vesicles', sensor: 18, angle: 1.5, turn: 0.15, speed: 1.6, decay: 0.975, diffusion: 0.8, deposit: 0.07, cross: -0.7, curl: 0.09, jitter: 0.03},
  colonies: {name: 'Soft colonies', sensor: 24, angle: 1.5, turn: 1.3, speed: 2.2, decay: 0.976, diffusion: 0.85, deposit: 0.07, cross: -0.65, slowdown: 0.98, slowStart: 0.25, slowEnd: 0.85, jitter: 0.12},
  foam: {name: 'Cellular foam', sensor: 28, angle: 1.45, turn: 1.3, speed: 1.1, decay: 0.972, diffusion: 0.8, deposit: 0.07, cross: 0, crowding: 2},
  swimmers: {name: 'Little swimmers', sensor: 6, angle: 1.57, turn: 1.57, speed: 1.1, decay: 0.96, diffusion: 0.8, deposit: 0.1, cross: -1},
  tides: {name: 'Chasing tides', sensor: 28, angle: 0.7, turn: 0.35, speed: 1.1, decay: 0.972, diffusion: 0.8, deposit: 0.07, cross: 0.2, cyclic: 1.5, curl: 0.025},
});
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
export const PALETTES = Object.freeze({
  mint: ['#0da6cc', '#1fa661', '#4d6bcc', '#030708'],
  dusk: ['#29b5ae', '#ae7cdb', '#e5b168', '#080b14'],
  citrus: ['#ff4c20', '#ffad28', '#55d56b', '#07574a'],
  neon: ['#ff0099', '#00c9ee', '#933cff', '#081d22'],
  'neon-blue': ['#ff0099', '#00c9ee', '#933cff', '#081d22'],
});
export function initialParticles(seed, count = COUNT) {
  let s = seed >>> 0;
  const random = () => {s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296;};
  const out = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const x = random();
    out.set([x, random(), random() * Math.PI * 2, i % 3], i * 4);
  }
  return out;
}
const FULLSCREEN = `#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`;
const EMPTY_FRAGMENT = `#version 300 es
precision highp float;
out vec4 color;void main(){color=vec4(0);}`;
// Preserve the original three presets' shader exactly: chaotic feedback amplifies
// even compiler-level floating-point changes from otherwise inactive new rules.
const LEGACY_UPDATE = `#version 300 es
precision highp float;
layout(location=0) in vec4 state;
out vec4 nextState;
uniform sampler2D field;
uniform vec2 size;
uniform float sensor, sensorAngle, turn, speed, crossWeight, tick;
float hash(float x){return fract(sin(x*127.1+tick*311.7)*43758.5453);}
float sense(vec2 pos,float a, int group){
 vec4 sensed=texture(field,fract(pos+vec2(cos(a),sin(a))*sensor/size));
 vec3 t=min(vec3(1.),sensed.rgb+vec3(sensed.a));
 float own=group==0?t.r:(group==1?t.g:t.b);
 return own+crossWeight*(t.r+t.g+t.b-own);
}
void main(){
 vec2 p=state.xy;float a=state.z;int g=int(state.w);
 float f=sense(p,a,g),l=sense(p,a+sensorAngle,g),r=sense(p,a-sensorAngle,g);
 if(f<l || f<r){
   if(f<l && f<r) a+=(hash(float(gl_VertexID))>.5?1.:-1.)*turn;
   else a+=(l>r?1.:-1.)*turn;
 }
 a+=(hash(float(gl_VertexID)+19.5)-.5)*.025;
 a=mod(a,6.28318530718);
 nextState=vec4(fract(p+vec2(cos(a),sin(a))*speed/size),a,state.w);
 gl_Position=vec4(0);
}`;
const UPDATE = `#version 300 es
precision highp float;
layout(location=0) in vec4 state;
out vec4 nextState;
uniform sampler2D field;
uniform vec2 size;
uniform float sensor, sensorAngle, turn, speed, crossWeight, tick;
uniform float crowding, cyclicWeight, curl, slowdown, jitter, slowStart, slowEnd;
float hash(float x){return fract(sin(x*127.1+tick*311.7)*43758.5453);}
float sense(vec2 pos,float a, int group){
 vec4 sensed=texture(field,fract(pos+vec2(cos(a),sin(a))*sensor/size));
 vec3 t=min(vec3(1.),sensed.rgb+vec3(sensed.a));
 float own=group==0?t.r:(group==1?t.g:t.b);
 float next=group==0?t.g:(group==1?t.b:t.r);
 float previous=group==0?t.b:(group==1?t.r:t.g);
 float score=own+crossWeight*(t.r+t.g+t.b-own);
 if(crowding>0.)score-=crowding*own*own;
 if(cyclicWeight!=0.)score+=cyclicWeight*(next-previous);
 return score;
}
void main(){
 vec2 p=state.xy;float a=state.z;int g=int(state.w);
 float f=sense(p,a,g),l=sense(p,a+sensorAngle,g),r=sense(p,a-sensorAngle,g);
 if(f<l || f<r){
   if(f<l && f<r) a+=(hash(float(gl_VertexID))>.5?1.:-1.)*turn;
   else a+=(l>r?1.:-1.)*turn;
 }
 a+=(hash(float(gl_VertexID)+19.5)-.5)*jitter;
 if(curl!=0.)a+=curl;
 a=mod(a,6.28318530718);
 float movement=speed;
 if(slowdown>0.){
   vec4 localField=texture(field,p);
   vec3 local=min(vec3(1.),localField.rgb+vec3(localField.a));
   float own=g==0?local.r:(g==1?local.g:local.b);
   movement*=mix(1.,.06,smoothstep(slowStart,slowEnd,own)*slowdown);
 }
 nextState=vec4(fract(p+vec2(cos(a),sin(a))*movement/size),a,state.w);
 gl_Position=vec4(0);
}`;
const DIFFUSE = `#version 300 es
precision highp float;
in vec2 uv;out vec4 color;
uniform sampler2D field;
uniform vec2 size, brush;
uniform vec4 portraitPatch0, portraitPatch1, portraitPatch2, portraitPreparation;
float portraitDeposit(vec4 source){
 vec2 d=(uv-source.xy)*size;
 return (1.-smoothstep(source.z*.35,max(source.z,.001),length(d)))*source.w;
}
uniform float decay, diffusion, brushRadius, brushStrength, roundingTick;
void main(){
 vec2 px=1./size;vec4 center=texture(field,uv);
 vec4 total=vec4(0);
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++)total+=texture(field,fract(uv+vec2(x,y)*px));
 vec4 t=mix(center,total/9.,diffusion)*decay;
 vec2 d=abs(uv-brush);d=min(d,1.-d)*size;
 float b=(1.-smoothstep(brushRadius*.6,brushRadius,length(d)))*abs(brushStrength);
 // Invisible interaction lives in alpha. Display reads RGB trails only.
 if(brushStrength>0.)t.a+=b;else t*=1.-b;
 // Weak portrait deposits share the invisible channel, never paint visible color.
 t.a+=portraitDeposit(portraitPatch0)+portraitDeposit(portraitPatch1)+portraitDeposit(portraitPatch2);
 vec2 preparationDistance=(uv-portraitPreparation.xy)*size;
 t.a+=(1.-smoothstep(portraitPreparation.z*.6,max(portraitPreparation.z,.001),length(preparationDistance)))*portraitPreparation.w;
 // Stochastic rounding lets even sub-byte trails fade instead of freezing forever.
 float noise=fract(sin(dot(floor(uv*size),vec2(12.9898,78.233))+roundingTick*17.31)*43758.5453);
 t=floor(clamp(t,0.,1.)*255.+noise)/255.;
 color=t;
}`;
const POINTS = `#version 300 es
precision highp float;
layout(location=0) in vec4 state;
flat out int group;
uniform float pointSize;
void main(){group=int(state.w);gl_Position=vec4(state.xy*2.-1.,0,1);gl_PointSize=pointSize;}`;
const DEPOSIT = `#version 300 es
precision highp float;
flat in int group;out vec4 color;uniform float amount;
void main(){color=vec4(group==0?vec3(amount,0,0):(group==1?vec3(0,amount,0):vec3(0,0,amount)),0);}`;
const PARTICLES = `#version 300 es
precision highp float;
flat in int group;out vec4 color;uniform float amount;
uniform vec3 color0, color1, color2;
void main(){
 vec3 c=group==0?color0:(group==1?color1:color2);
 color=vec4(c*amount,1);
}`;
const DISPLAY = `#version 300 es
precision highp float;
in vec2 uv;out vec4 color;uniform sampler2D field;uniform float exposure, showField;
uniform vec3 color0, color1, color2, background;
void main(){
 vec3 t=texture(field,uv).rgb;
 vec3 ink=t.r*color0+t.g*color1+t.b*color2;
 vec3 c=1.-exp(-ink*exposure);
 vec3 bg=background;
 color=vec4(bg+c*showField,1);
}`;
export class FieldLife {
  constructor(canvas, {seed = 42, preset = 'networks'} = {}) {
    const gl = canvas.getContext('webgl2', {alpha: false, antialias: false, depth: false, preserveDrawingBuffer: true});
    if (!gl) throw new Error('This playground needs WebGL 2. Try a recent Chrome, Firefox or Safari.');
    this.gl = gl; this.canvas = canvas; this.tick = 0; this.mode = 'both'; this.exposure = 2.4;
    this.palette = 'mint';
    this.portraitPatches = [[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    this.portraitPreparation = [0,0,0,0];
    this.brush = {x: -10, y: -10, strength: 0, radius: 23};
    this.emptyVAO = gl.createVertexArray();
    this.legacyUpdateProgram = this.program(LEGACY_UPDATE, EMPTY_FRAGMENT, ['nextState']);
    this.updateProgram = this.program(UPDATE, EMPTY_FRAGMENT, ['nextState']);
    this.diffuseProgram = this.program(FULLSCREEN, DIFFUSE);
    this.depositProgram = this.program(POINTS, DEPOSIT);
    this.particleProgram = this.program(POINTS, PARTICLES);
    this.displayProgram = this.program(FULLSCREEN, DISPLAY);
    this.feedback = gl.createTransformFeedback();
    this.buffers = [gl.createBuffer(), gl.createBuffer()];
    this.vaos = this.buffers.map(buffer => {
      const vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,4,gl.FLOAT,false,16,0);return vao;
    });
    this.textures=[];this.fbos=[];
    for(let i=0;i<2;i++){
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.REPEAT);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,WIDTH,HEIGHT,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      const fbo=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('Unable to create field texture.');
      this.textures.push(texture);this.fbos.push(fbo);
    }
    gl.disable(gl.DITHER);gl.disable(gl.DEPTH_TEST);
    this.reset(seed,preset);
  }
  program(vs, fs, feedback) {
    const gl=this.gl, p=gl.createProgram();
    for(const [type,source] of [[gl.VERTEX_SHADER,vs],[gl.FRAGMENT_SHADER,fs]]){
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));
      gl.attachShader(p,shader);gl.deleteShader(shader);
    }
    if(feedback)gl.transformFeedbackVaryings(p,feedback,gl.INTERLEAVED_ATTRIBS);
    gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));
    return {p, locations: new Map()};
  }
  use(program, values = {}) {
    const gl=this.gl;gl.useProgram(program.p);
    for(const [key,value] of Object.entries(values)){
      if(!program.locations.has(key))program.locations.set(key,gl.getUniformLocation(program.p,key));
      const loc=program.locations.get(key);
      if(Array.isArray(value)) {
        if(value.length===4)gl.uniform4fv(loc,value);else if(value.length===3)gl.uniform3fv(loc,value);else gl.uniform2fv(loc,value);
      } else gl.uniform1f(loc,value);
    }
  }
  reset(seed = this.seed, preset = this.preset) {
    if(!Object.hasOwn(PRESETS,preset))throw new Error('Unknown preset');
    const gl=this.gl;this.seed=seed>>>0;this.preset=preset;this.settings=PRESETS[preset];
    this.tick=0;this.activeField=0;this.activeParticles=0;this.brush.strength=0;
    const data=initialParticles(this.seed);
    for(const buffer of this.buffers){gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_COPY);}
    for(const fbo of this.fbos){gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);}
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);
  }
  fieldPass(editOnly = false) {
    const gl=this.gl, s=this.settings, dst=1-this.activeField;
    gl.disable(gl.BLEND);gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbos[dst]);gl.viewport(0,0,WIDTH,HEIGHT);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[this.activeField]);
    this.use(this.diffuseProgram,{size:[WIDTH,HEIGHT],decay:editOnly?1:s.decay,diffusion:editOnly?0:s.diffusion,
      brush:[this.brush.x,this.brush.y],brushRadius:this.brush.radius,brushStrength:this.brush.strength,roundingTick:this.tick,
      portraitPatch0:this.portraitPatches[0],portraitPatch1:this.portraitPatches[1],portraitPatch2:this.portraitPatches[2],portraitPreparation:this.portraitPreparation});
    gl.bindVertexArray(this.emptyVAO);gl.drawArrays(gl.TRIANGLES,0,3);this.activeField=dst;
  }
  step() {
    const gl=this.gl,s=this.settings;this.fieldPass();
    const dst=1-this.activeParticles;
    // Even rasterizer-discard draws cannot sample an attached render target.
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindBuffer(gl.ARRAY_BUFFER,null);
    const advanced=s.crowding||s.cyclic||s.curl||s.slowdown||s.jitter!==undefined;
    this.use(advanced?this.updateProgram:this.legacyUpdateProgram,{size:[WIDTH,HEIGHT],sensor:s.sensor,sensorAngle:s.angle,turn:s.turn,speed:s.speed,crossWeight:s.cross,tick:this.tick,crowding:s.crowding??0,cyclicWeight:s.cyclic??0,curl:s.curl??0,slowdown:s.slowdown??0,jitter:s.jitter??.025,slowStart:s.slowStart??.04,slowEnd:s.slowEnd??.4});
    gl.bindTexture(gl.TEXTURE_2D,this.textures[this.activeField]);gl.bindVertexArray(this.vaos[this.activeParticles]);
    gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,this.feedback);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,this.buffers[dst]);
    gl.enable(gl.RASTERIZER_DISCARD);gl.beginTransformFeedback(gl.POINTS);gl.drawArrays(gl.POINTS,0,COUNT);gl.endTransformFeedback();
    gl.disable(gl.RASTERIZER_DISCARD);gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER,0,null);gl.bindTransformFeedback(gl.TRANSFORM_FEEDBACK,null);
    this.activeParticles=dst;
    // The deposit pass writes the field; it does not sample its own framebuffer.
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbos[this.activeField]);
    gl.bindTexture(gl.TEXTURE_2D,null);
    this.use(this.depositProgram,{amount:s.deposit,pointSize:1});gl.bindVertexArray(this.vaos[dst]);
    gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.drawArrays(gl.POINTS,0,COUNT);gl.disable(gl.BLEND);
    this.tick++;
  }
  draw() {
    const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,this.canvas.width,this.canvas.height);
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.textures[this.activeField]);
    const colors = (PALETTES[this.palette] ?? PALETTES.mint).map(rgb);
    const palette = {color0:colors[0],color1:colors[1],color2:colors[2]};
    this.use(this.displayProgram,{...palette,background:colors[3].map(v=>v*.15),exposure:this.exposure,showField:this.mode==='particles'?0:1});
    gl.bindVertexArray(this.emptyVAO);gl.drawArrays(gl.TRIANGLES,0,3);
    if(this.mode!=='field'){
      this.use(this.particleProgram,{...palette,amount:this.mode==='particles'?.8:.08,pointSize:Math.max(1,this.canvas.width/WIDTH)});
      gl.bindVertexArray(this.vaos[this.activeParticles]);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE);gl.drawArrays(gl.POINTS,0,COUNT);gl.disable(gl.BLEND);
    }
  }
  snapshot() {
    const gl=this.gl, pixels=new Uint8Array(WIDTH*HEIGHT*4), particles=new Float32Array(COUNT*4);
    gl.bindFramebuffer(gl.FRAMEBUFFER,this.fbos[this.activeField]);gl.readPixels(0,0,WIDTH,HEIGHT,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    gl.bindBuffer(gl.ARRAY_BUFFER,this.buffers[this.activeParticles]);gl.getBufferSubData(gl.ARRAY_BUFFER,0,particles);
    let fieldHash=2166136261, particleHash=2166136261, lit=0;
    for(let i=0;i<pixels.length;i++)if(i%4!==3){fieldHash=Math.imul(fieldHash^pixels[i],16777619)>>>0;if(pixels[i]>12)lit++;}
    const bytes=new Uint8Array(particles.buffer);
    for(const b of bytes)particleHash=Math.imul(particleHash^b,16777619)>>>0;
    return {tick:this.tick,seed:this.seed,preset:this.preset,fieldHash,particleHash,lit,finite:particles.every(Number.isFinite),glError:gl.getError(),count:COUNT};
  }
}
