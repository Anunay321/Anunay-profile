(function(){
'use strict';
//#BEGIN-GEN
var TAU=Math.PI*2;
function R(){return Math.random();}
function clamp(v,a,b){return v<a?a:(v>b?b:v);}
function lerp(a,b,t){return a+(b-a)*t;}
function mix3(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];}
function mul3(a,k){return [a[0]*k,a[1]*k,a[2]*k];}
function sstep(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);}
function hash(x,y,z){var h=Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453;return h-Math.floor(h);}
function vnoise(x,y,z){
  var xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),xf=x-xi,yf=y-yi,zf=z-zi;
  var u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf),w=zf*zf*(3-2*zf);
  function h(a,b,c){return hash(xi+a,yi+b,zi+c);}
  return lerp(lerp(lerp(h(0,0,0),h(1,0,0),u),lerp(h(0,1,0),h(1,1,0),u),v),
              lerp(lerp(h(0,0,1),h(1,0,1),u),lerp(h(0,1,1),h(1,1,1),u),v),w);
}
function fbm(x,y,z,o){var a=0.5,f=1,s=0;for(var i=0;i<o;i++){s+=a*vnoise(x*f,y*f,z*f);f*=2.03;a*=0.5;}return s/0.9375;}
function ridged(x,y,z,o){var a=0.5,f=1,s=0;for(var i=0;i<o;i++){var v=vnoise(x*f,y*f,z*f);s+=a*(1.0-2.0*Math.abs(v-0.5));f*=2.03;a*=0.5;}return s;}
function turbulence(x,y,z,o){var a=0.5,f=1,s=0;for(var i=0;i<o;i++){s+=a*Math.abs(vnoise(x*f,y*f,z*f)*2-1);f*=2.03;a*=0.5;}return s;}

function inPoly(lon,lat,poly){
  var c=false;
  for(var i=0,j=poly.length-1;i<poly.length;j=i++){
    var xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>lat)!==(yj>lat))&&(lon<(xj-xi)*(lat-yi)/(yj-yi)+xi))c=!c;
  }
  return c;
}
var LAND=[
 [[-168,66],[-140,70],[-95,72],[-80,68],[-62,60],[-55,50],[-66,44],[-76,35],[-81,25],[-90,29],[-97,26],[-105,22],[-112,29],[-118,33],[-124,40],[-125,49],[-135,58],[-150,60],[-165,60]],
 [[-105,22],[-97,20],[-90,21],[-88,16],[-83,15],[-80,9],[-77,8],[-80,7],[-85,10],[-92,14],[-98,16],[-105,20]],
 [[-80,8],[-72,12],[-62,10],[-52,5],[-35,-6],[-39,-15],[-48,-26],[-58,-38],[-66,-47],[-70,-55],[-75,-50],[-73,-38],[-71,-20],[-76,-14],[-81,-5],[-79,2]],
 [[-55,60],[-45,60],[-20,70],[-20,80],[-40,83],[-65,80],[-72,76],[-58,68]],
 [[-9,37],[-9,43],[-2,44],[-5,48],[2,51],[8,54],[10,58],[5,62],[15,69],[30,71],[60,69],[80,73],[105,77],[140,72],[170,69],[180,65],[160,60],[155,52],[140,48],[135,35],[122,30],[122,22],[108,18],[106,10],[100,8],[98,16],[90,22],[80,15],[77,8],[73,20],[67,25],[57,25],[52,17],[45,13],[35,28],[36,36],[28,36],[24,38],[20,40],[13,38],[8,44],[3,42]],
 [[-17,21],[-10,30],[-6,36],[10,37],[20,33],[32,31],[35,28],[43,12],[51,12],[40,-3],[40,-15],[35,-25],[27,-34],[18,-34],[13,-17],[9,-2],[8,4],[-8,4],[-15,11]],
 [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-27],[150,-37],[141,-38],[131,-31],[115,-34]],
 [[-5,50],[1,51],[0,58],[-5,58]],
 [[44,-25],[50,-15],[49,-12],[44,-17]],
 [[130,32],[135,34],[140,36],[141,41],[140,45],[137,37]],
 [[95,5],[105,-6],[115,-8],[108,-3],[100,2]],
 [[115,-1],[119,7],[110,2],[109,-3]]
];


function worley(x,y,z){
  var xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),f1=9;
  for(var dx=-1;dx<=1;dx++)for(var dy=-1;dy<=1;dy++)for(var dz=-1;dz<=1;dz++){
    var cx=xi+dx,cy=yi+dy,cz=zi+dz;
    var px=cx+hash(cx,cy,cz),py=cy+hash(cy+7.1,cz,cx),pz=cz+hash(cz+3.3,cx,cy+5.7);
    var d=(x-px)*(x-px)+(y-py)*(y-py)+(z-pz)*(z-pz);
    if(d<f1)f1=d;
  }
  return Math.sqrt(f1);
}
// crater brightness multiplier: dark floor, bright rim
function crater(x,y,z,sc){
  var d=worley(x*sc,y*sc,z*sc);
  if(d<0.3)return 0.74+d*0.8;
  if(d<0.42)return 1.16-(d-0.3)*1.3;
  return 1;
}
function ell(a,b,ca,cb,ra,rb){var u=(a-ca)/ra,v=(b-cb)/rb;return u*u+v*v;}
function dlon(a,b){var d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;}

function cSun(x,y,z,lat){
  var n=fbm(x*4,y*4,z*4,5),w=worley(x*12,y*12,z*12),gran=1-clamp(w*1.5,0,1);
  var w2=worley(x*20,y*20,z*20),micro=1-clamp(w2*2.0,0,1);
  var t=clamp(0.25+n*0.75+gran*0.4+micro*0.15,0,1);
  var c=mix3([1.0,0.28,0.02],[1.0,0.95,0.55],t);
  var limb=Math.sqrt(Math.max(0,1-x*x-y*y-z*z));
  c=mix3(mul3(c,0.6),c,clamp(limb*2.5,0,1));
  var sn=fbm(x*2.4+11,y*2.4,z*2.4,4);
  if(sn>0.58&&Math.abs(lat)<0.7)c=mul3(c,0.3+(0.72-Math.min(sn,0.72))*2.2);
  var fac=fbm(x*18,y*18,z*18,3);
  if(fac>0.6&&Math.abs(lat)<0.55){var bright=clamp((fac-0.6)*6,0,1);c=mix3(c,[1.0,1.0,0.85],bright*0.4);}
  return c;
}
function cMercury(x,y,z){
  var n=fbm(x*4+1,y*4,z*4,5),g=0.38+n*0.48;
  g*=crater(x,y,z,6)*crater(x+3,y,z,13)*crater(x+7,y,z,22);
  var w=worley(x*8,y*8,z*8);
  if(w<0.15)g*=0.7;
  var tint=fbm(x*6+2,y*6,z*6,3)*0.06;
  return [g+tint*0.5,g*0.95,g*0.88-tint*0.3];
}
function cVenus(x,y,z,lat){
  var wx=fbm(x*2,y*2,z*2,4);
  var n=fbm(x*2.6+wx*1.8,y*4+wx,z*2.6,6);
  var turb=turbulence(x*5,y*3,z*5,4)*0.12;
  var b=0.5+0.5*Math.sin(lat*8+n*6+turb*3);
  var c=mix3([0.84,0.60,0.30],[0.99,0.93,0.73],clamp(n*1.4,0,1));
  c=mix3(c,[0.96,0.80,0.52],b*0.38);
  var vortex=fbm(x*8+wx*2,y*8,z*8+wx*2,3);
  if(vortex>0.62)c=mix3(c,[1.0,0.88,0.55],0.25);
  return c;
}
function cEarth(x,y,z,lat,lon){
  var la=lat*57.2958,lo=lon*57.2958,land=false;
  for(var k=0;k<LAND.length;k++){if(inPoly(lo,la,LAND[k])){land=true;break;}}
  var n=fbm(x*5,y*5,z*5,5),el=fbm(x*7+2,y*7,z*7,6),col,glow=[0,0,0],ice=false;
  if(la<-66){col=[0.92,0.95,1.0];ice=true;}
  else if(land){
    if(la>78||(la>62&&lo>-75&&lo<-10)){col=[0.92,0.95,1.0];ice=true;}
    else{
      var green=mix3([0.08,0.32,0.10],[0.30,0.50,0.17],n);
      if(la>55)green=mix3(green,[0.40,0.46,0.36],0.6);
      if(la>0&&la<20&&(lo>-20&&lo<55))green=mix3(green,[0.22,0.42,0.12],0.4);
      var band=Math.abs(la)>10&&Math.abs(la)<36?1:0;
      var dz=band*sstep(0.40,0.60,fbm(x*3+5,y*3,z*3,5));
      col=mix3(green,[0.74,0.62,0.34],dz);
      if(el>0.58)col=mix3(col,[0.52,0.46,0.40],sstep(0.58,0.68,el));
      if(el>0.68||(Math.abs(la)>44&&el>0.60))col=mix3(col,[0.96,0.97,1],0.88);
      if(Math.abs(la)<58&&fbm(x*9+20,y*9,z*9,4)>0.50&&hash(x*260,y*260,z*260)>0.45)glow=[1.0,0.78,0.40];
    }
  }else{
    var depth=fbm(x*8+4,y*8,z*8,4);
    col=mix3([0.01,0.06,0.32],[0.04,0.22,0.58],clamp(n*1.4,0,1));
    col=mix3(col,[0.08,0.38,0.68],sstep(0.50,0.72,depth)*0.4);
    var shallow=sstep(0.3,0.45,depth)*sstep(0.55,0.45,depth);
    col=mix3(col,[0.05,0.42,0.52],shallow*0.35);
  }
  var cn=fbm(x*3.2+9,y*3.2,z*3.2,6),cl=0;
  if(cn>0.52){cl=clamp((cn-0.52)*4.5,0,0.92);col=mix3(col,[1,1,1],cl);}
  var cn2=fbm(x*6+15,y*6,z*6,4);
  if(cn2>0.58&&cl<0.3){var wisp=clamp((cn2-0.58)*5,0,0.5);col=mix3(col,[0.95,0.96,0.98],wisp);}
  if(cl>0.2){glow=[glow[0]*(1-cl),glow[1]*(1-cl),glow[2]*(1-cl)];}
  return [col[0],col[1],col[2],glow[0]*0.9,glow[1]*0.9,glow[2]*0.9];
}
function cMoon(x,y,z){
  var m=fbm(x*2.2+3,y*2.2,z*2.2,4),g=m<0.44?0.34+m*0.4:0.62+fbm(x*6,y*6,z*6,3)*0.3;
  g*=crater(x,y,z,7)*crater(x+2,y,z,15);
  return [g,g,g*0.97];
}
function cMars(x,y,z,lat,lon){
  var n=fbm(x*3+2,y*3,z*3,6);
  var ridge=ridged(x*5,y*5,z*5,4)*0.15;
  var c=mix3([0.38,0.16,0.08],[0.82,0.40,0.20],clamp(n*1.5+ridge,0,1));
  c=mul3(c,crater(x,y,z,8)*0.5+0.5);
  var dust=turbulence(x*7,y*7,z*7,3)*0.08;
  c=[c[0]+dust,c[1]+dust*0.4,c[2]+dust*0.2];
  if(Math.abs(lat+0.1)<0.045&&lon>-1.55&&lon<-0.45)c=[0.20,0.08,0.05];
  if(ell(lat,dlon(lon,-2.2),0.33,0,0.18,0.18)<1)c=mix3(c,[0.88,0.62,0.48],0.75);
  if(ell(lat,dlon(lon,1.3),-0.65,0,0.22,0.24)<1)c=mix3(c,[0.88,0.70,0.58],0.65);
  if(ell(lat,dlon(lon,0.8),0.4,0,0.06,0.12)<1)c=mix3(c,[0.3,0.14,0.09],0.6);
  if(Math.abs(lat)>1.25)c=mix3(c,[0.96,0.94,0.93],0.92);
  return c;
}
function cJupiter(x,y,z,lat,lon){
  var turb=turbulence(x*6,y*3,z*6,4)*0.15;
  var lw=lat+(fbm(x*4,y*7,z*4,5)-0.5)*0.35+0.04*Math.sin(lon*8+lat*22)+turb;
  var t=0.5+0.5*Math.sin(lw*14),c;
  var belt=[0.58,0.32,0.17],zone=[0.96,0.90,0.76],mid=[0.82,0.56,0.32];
  c=t<0.5?mix3(belt,mid,t*2):mix3(mid,zone,(t-0.5)*2);
  var st=fbm(x*8,y*24,z*8,4);
  if(st>0.60)c=mix3(c,[0.98,0.95,0.9],0.38);
  var fine=fbm(x*14,y*40,z*14,3);
  c=mix3(c,mul3(c,0.85+fine*0.3),0.3);
  var ov=[[-0.72,2.0],[-0.5,-1.6],[0.42,-0.4],[0.15,2.8]];
  for(var i=0;i<ov.length;i++){if(ell(lat,dlon(lon,ov[i][1]),ov[i][0],0,0.05,0.09)<1)c=mix3(c,[0.98,0.96,0.92],0.8);}
  var d=ell(lat,dlon(lon,0.6),-0.33,0,0.15,0.34);
  if(d<1.8){var sw=0.5+0.5*Math.sin(Math.atan2(lat+0.33,dlon(lon,0.6)*0.5)*3.5+d*7);c=mix3(c,mix3([0.78,0.18,0.08],[0.92,0.52,0.30],sw),sstep(1.8,0.4,d));}
  var d2=ell(lat,dlon(lon,-1.4),-0.6,0,0.06,0.12);
  if(d2<1.2)c=mix3(c,[0.9,0.65,0.45],sstep(1.2,0.3,d2)*0.5);
  return c;
}
function cSaturn(x,y,z,lat,lon){
  var turb=turbulence(x*5,y*3,z*5,3)*0.06;
  var lw=lat+(fbm(x*3,y*6,z*3,4)-0.5)*0.16+turb;
  var t=0.5+0.5*Math.sin(lw*18+fbm(x*4,y*12,z*4,4));
  var c=mix3([0.94,0.84,0.56],[0.72,0.58,0.38],t);
  var fine=fbm(x*12,y*30,z*12,3);
  c=mix3(c,mul3(c,0.88+fine*0.25),0.25);
  if(lat>1.2){c=mix3(c,[0.48,0.58,0.68],0.55);
    var hex=0.5+0.5*Math.sin(lon*3)*Math.sin(lat*6);c=mix3(c,[0.42,0.52,0.62],hex*0.2);}
  if(lat<-1.2)c=mix3(c,[0.52,0.55,0.48],0.35);
  return c;
}
function cUranus(x,y,z,lat){
  var t=0.5+0.5*Math.sin(lat*10+fbm(x*2,y*5,z*2,3)*1.4);
  var c=mix3([0.52,0.82,0.88],[0.7,0.92,0.94],t);
  if(lat>1.15)c=mix3(c,[0.85,0.97,0.98],0.4);
  return c;
}
function cNeptune(x,y,z,lat,lon){
  var turb=turbulence(x*4,y*3,z*4,4)*0.1;
  var t=0.5+0.5*Math.sin(lat*12+fbm(x*3,y*7,z*3,5)*2.0+turb);
  var c=mix3([0.10,0.20,0.78],[0.28,0.48,0.96],t);
  var fine=fbm(x*10,y*25,z*10,3);
  c=mix3(c,mul3(c,0.85+fine*0.3),0.3);
  if(fbm(x*5,y*18,z*5,4)>0.65)c=mix3(c,[0.92,0.95,1],0.58);
  var d=ell(lat,dlon(lon,1.2),-0.4,0,0.15,0.32);
  if(d<1.2)c=mix3(c,[0.04,0.08,0.38],0.88*sstep(1.2,0.25,d));
  var d2=ell(lat,dlon(lon,-0.8),0.3,0,0.08,0.16);
  if(d2<1)c=mix3(c,[0.06,0.14,0.50],0.6*sstep(1,0.3,d2));
  return c;
}
function cPluto(x,y,z,lat,lon){
  var n=fbm(x*4+7,y*4,z*4,4);
  var c=mix3([0.42,0.29,0.23],[0.78,0.62,0.48],clamp(n*1.5,0,1));
  if(Math.abs(lat+0.15)<0.22&&lon>-0.3&&lon<1.6)c=mix3(c,[0.3,0.13,0.09],0.85);
  var d=ell(lat,dlon(lon,3.0),0.3,0,0.4,0.55);
  if(d<1)c=mix3(c,[0.97,0.91,0.84],sstep(1,0.4,d));
  return mul3(c,crater(x,y,z,9)*0.4+0.6);
}
function icy(base,dark,sd,cs){
  return function(x,y,z){var n=fbm(x*4+sd,y*4,z*4,4);var c=mix3(dark,base,clamp(n*1.4,0,1));return mul3(c,crater(x+sd,y,z,cs||6));};
}
var cPhobos=icy([0.44,0.39,0.35],[0.24,0.21,0.19],1,5);
var cDeimos=icy([0.5,0.45,0.4],[0.32,0.28,0.25],2,5);
var cEnceladus=function(x,y,z){var n=fbm(x*4,y*4,z*4,3);var c=mix3([0.9,0.94,0.98],[0.78,0.86,0.94],n);if(Math.abs(vnoise(x*7,y*7,z*7)-0.5)<0.03)c=[0.55,0.7,0.85];return c;};
var cRhea=icy([0.72,0.7,0.66],[0.5,0.48,0.46],3,7);
var cIapetus=function(x,y,z,lat,lon){
  var lead=Math.cos(dlon(lon,1.2))>-0.05;
  var c=lead?[0.14,0.1,0.08]:[0.86,0.86,0.82];
  var n=fbm(x*4,y*4,z*4,3);return mul3(c,(0.85+n*0.3)*crater(x,y,z,7));
};
var cMiranda=icy([0.66,0.66,0.68],[0.4,0.4,0.42],4,6);
var cAriel=icy([0.72,0.72,0.72],[0.5,0.5,0.5],5,7);
var cUmbriel=icy([0.42,0.42,0.42],[0.26,0.26,0.26],6,7);
var cTitania=icy([0.68,0.64,0.6],[0.42,0.38,0.35],7,8);
var cOberon=icy([0.6,0.55,0.52],[0.36,0.32,0.3],8,8);
var cTriton=function(x,y,z,lat){
  var w=worley(x*9,y*9,z*9),c=mix3([0.9,0.82,0.8],[0.62,0.56,0.58],clamp(w*1.4-0.2,0,1));
  if(lat<-0.7)c=mix3(c,[0.98,0.88,0.86],0.7);
  if(Math.abs(vnoise(x*10,y*20,z*10)-0.5)<0.03)c=[0.25,0.22,0.24];
  return c;
};
var cCharon=function(x,y,z,lat){
  var n=fbm(x*4+9,y*4,z*4,4),g=0.5+n*0.35,c=[g,g*0.97,g*0.95];
  if(lat>1.0)c=mix3(c,[0.6,0.28,0.22],0.8);
  return mul3(c,crater(x,y,z,7));
};
var cCeres=function(x,y,z,lat,lon){
  var g=0.32+fbm(x*4,y*4,z*4,4)*0.3;g*=crater(x,y,z,8)*crater(x+4,y,z,16);
  var c=[g,g,g*0.98];
  if(ell(lat,dlon(lon,2.7),0.35,0,0.07,0.07)<1)c=[0.95,0.95,0.9];
  return c;
};
var cVesta=function(x,y,z,lat){
  var g=0.42+fbm(x*4,y*4,z*4,4)*0.35;g*=crater(x,y,z,8);
  if(Math.abs(Math.sin(lat*22+fbm(x*3,y*3,z*3,3)*3))<0.1)g*=0.75;
  return [g,g*0.97,g*0.92];
};
var cHaumea=function(x,y,z,lat,lon){
  var n=fbm(x*4,y*4,z*4,3),c=mix3([0.8,0.82,0.86],[0.92,0.93,0.95],n);
  if(ell(lat,dlon(lon,1.0),0.1,0,0.3,0.4)<1)c=mix3(c,[0.6,0.3,0.25],0.8);
  return c;
};
var cMakemake=function(x,y,z){var n=fbm(x*3,y*3,z*3,5);return mix3([0.5,0.28,0.2],[0.86,0.6,0.42],clamp(n*1.4,0,1));};
var cEris=function(x,y,z){var n=fbm(x*3,y*3,z*3,4);var g=0.82+n*0.15;return [g,g,g*1.02];};
var cComet=function(x,y,z){var g=0.12+fbm(x*5,y*5,z*5,4)*0.2;g*=crater(x,y,z,6);return [g,g*0.95,g*0.9];};
var cIo=function(x,y,z){var n=fbm(x*5,y*5,z*5,4);var c=mix3([0.96,0.87,0.32],[0.9,0.7,0.2],n);
  var v=vnoise(x*9,y*9,z*9);if(v>0.72)c=[0.72,0.3,0.1];
  var w=worley(x*7,y*7,z*7);var g=[0,0,0];if(w<0.1){c=[0.12,0.09,0.08];g=[0.9,0.35,0.05];}
  return [c[0],c[1],c[2],g[0],g[1],g[2]];};
var cEuropa=function(x,y,z){var n=fbm(x*4,y*4,z*4,3);var c=mix3([0.9,0.86,0.76],[0.8,0.76,0.66],n);if(Math.abs(vnoise(x*8,y*8,z*8)-0.5)<0.035||Math.abs(vnoise(x*14+3,y*14,z*14)-0.5)<0.02)c=[0.62,0.4,0.26];return c;};
var cGanymede=function(x,y,z){var n=fbm(x*5,y*5,z*5,4);var c=mix3([0.36,0.33,0.3],[0.74,0.7,0.64],Math.min(1,n*1.3));return mul3(c,crater(x,y,z,8));};
var cCallisto=function(x,y,z){var g=0.24+fbm(x*5,y*5,z*5,4)*0.22;g*=crater(x,y,z,9)*crater(x+1,y,z,18);if(crater(x,y,z,9)>1.12)g+=0.15;return [g,g*0.95,g*0.9];};
var cTitan=function(x,y,z){var n=fbm(x*2,y*2,z*2,3);var c=mix3([0.82,0.55,0.2],[0.92,0.7,0.34],n);if(fbm(x*5+3,y*5,z*5,3)<0.3)c=mul3(c,0.85);return c;};


// optional args: squash [sx,sy,sz], rough amplitude
function sphereData(n,radius,fn,squash,rough){
  var pos=new Float32Array(n*3),col=new Float32Array(n*3),glow=new Float32Array(n*3),ga=2.399963;
  var sq=squash||[1,1,1],hasGlow=false;
  for(var i=0;i<n;i++){
    var y=1-2*(i+0.5)/n,r=Math.sqrt(1-y*y),ph=i*ga;
    var x=Math.cos(ph)*r,z=Math.sin(ph)*r;
    var lat=Math.asin(y),lon=Math.atan2(-z,x);
    var c=fn(x,y,z,lat,lon);
    var rr=rough?1+rough*(fbm(x*3+1,y*3,z*3,3)-0.5)*2:1;
    pos[i*3]=x*radius*rr*sq[0];pos[i*3+1]=y*radius*rr*sq[1];pos[i*3+2]=z*radius*rr*sq[2];
    var v=0.95+R()*0.1;
    col[i*3]=Math.min(1.2,c[0]*v);col[i*3+1]=Math.min(1.2,c[1]*v);col[i*3+2]=Math.min(1.2,c[2]*v);
    if(c.length>3){glow[i*3]=c[3];glow[i*3+1]=c[4];glow[i*3+2]=c[5];hasGlow=true;}
  }
  return {pos:pos,col:col,glow:glow,ws:Math.sqrt(4*Math.PI*radius*radius/n)*1.6};
}
function ringData(n,inner,outer,colorFn,densityFn,thick){
  var pos=new Float32Array(n*3),col=new Float32Array(n*3),k=0,guard=0;
  while(k<n&&guard<n*40){
    guard++;
    var r=inner+R()*(outer-inner);
    if(R()>densityFn(r))continue;
    var a=R()*TAU,c=colorFn(r),v=0.9+R()*0.2;
    pos[k*3]=Math.cos(a)*r;pos[k*3+1]=(R()-0.5)*thick;pos[k*3+2]=Math.sin(a)*r;
    col[k*3]=c[0]*v;col[k*3+1]=c[1]*v;col[k*3+2]=c[2]*v;k++;
  }
  return {pos:pos.subarray(0,k*3),col:col.subarray(0,k*3),count:k};
}
//#END-GEN

var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
var small=window.matchMedia('(max-width:700px)').matches;
var CM=small?0.5:1;
var loadEl=document.getElementById('load');
function start(){
var canvas=document.getElementById('gl'),renderer;
try{renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
catch(e){document.body.classList.add('nogl');loadEl.style.display='none';return;}
renderer.setClearColor(0x03040a,1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
var scene=new THREE.Scene();
var FOV=50;
var camera=new THREE.PerspectiveCamera(FOV,1,0.05,4000);
var U={uProj:{value:1000},uPR:{value:1},uTime:{value:0},uPhase:{value:0}};

// ---------- shaders ----------
var FRAG='varying vec3 vCol; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; float a=1.0-smoothstep(0.35,0.5,d); gl_FragColor=vec4(vCol*a,a); }';
var FRAGA='varying vec3 vCol; varying float vA; void main(){ float d=length(gl_PointCoord-0.5); if(d>0.5) discard; float a=(1.0-smoothstep(0.3,0.5,d))*vA; gl_FragColor=vec4(vCol*a,a); }';
var BODY_VERT=[
  'attribute vec3 aColor; attribute vec3 aGlow; uniform float uWorld; uniform float uEmit; uniform float uFlat; uniform float uShadowR; uniform float uProj; uniform float uPR; varying vec3 vCol;',
  'void main(){',
  '  vec4 wp = modelMatrix*vec4(position,1.);',
  '  vec3 nl = mix(position, vec3(0.,1.,0.), uFlat);',
  '  vec3 n = normalize((modelMatrix*vec4(nl,0.)).xyz);',
  '  vec3 V = normalize(cameraPosition - wp.xyz);',
  '  float limb = pow(max(dot(n,V),0.0), 0.3);',
  '  vec3 L = normalize(-wp.xyz);',
  '  float dl = dot(n,L); dl = mix(dl, abs(dl), uFlat);',
  '  float lit = 0.045 + 0.955*smoothstep(-0.08,0.55,dl);',
  '  if(uShadowR > 0.){',
  '    vec3 cW = (modelMatrix*vec4(0.,0.,0.,1.)).xyz; vec3 Lc = normalize(-cW); vec3 tp = wp.xyz - cW; float al = dot(tp,Lc);',
  '    if(al < 0.){ float dd = length(tp - Lc*al); lit *= mix(0.1, 1., smoothstep(uShadowR*0.92, uShadowR*1.04, dd)); }',
  '  }',
  '  float spec = pow(max(dot(reflect(-L,n),V),0.0),32.0)*0.15*(1.0-uEmit);',
  '  vCol = aColor*mix(lit,1.15,uEmit)*limb + aGlow*(1. - smoothstep(-0.05,0.3,dl)) + vec3(spec);',
  '  vec4 mv = viewMatrix*wp;',
  '  gl_Position = projectionMatrix*mv;',
  '  gl_PointSize = clamp(uWorld*uProj/(-mv.z), 1.6*uPR, 48.*uPR);',
  '}'].join('\n');
function bodyMat(ws,emit,flat,shadowR){
  return new THREE.ShaderMaterial({uniforms:{uWorld:{value:ws},uEmit:{value:emit||0},uFlat:{value:flat||0},uShadowR:{value:shadowR||0},uProj:U.uProj,uPR:U.uPR},vertexShader:BODY_VERT,fragmentShader:FRAG});
}
function atmoMat(ws,col,str){
  return new THREE.ShaderMaterial({
    uniforms:{uWorld:{value:ws},uCol:{value:new THREE.Vector3(col[0],col[1],col[2])},uStr:{value:str},uProj:U.uProj,uPR:U.uPR},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:[
     'uniform float uWorld; uniform vec3 uCol; uniform float uStr; uniform float uProj; uniform float uPR; varying vec3 vCol; varying float vA;',
     'void main(){',
     '  vec4 wp = modelMatrix*vec4(position,1.);',
     '  vec3 n = normalize((modelMatrix*vec4(position,0.)).xyz);',
     '  vec3 V = normalize(cameraPosition - wp.xyz);',
     '  float NdV = abs(dot(n,V));',
     '  float fr = pow(1.0 - NdV, 2.8) + pow(1.0 - NdV, 8.0)*0.5;',
     '  vec3 L = normalize(-wp.xyz);',
     '  float lit = smoothstep(-0.30,0.50,dot(n,L));',
     '  float scatter = pow(max(dot(V,-L),0.0),3.0)*0.15;',
     '  vA = (fr*lit + scatter)*uStr; vCol = uCol;',
     '  vec4 mv = viewMatrix*wp; gl_Position = projectionMatrix*mv;',
     '  gl_PointSize = clamp(uWorld*uProj/(-mv.z), 1.4*uPR, 30.*uPR);',
     '}'].join('\n'),
    fragmentShader:FRAGA});
}
function beltMat(size,tint){
  return new THREE.ShaderMaterial({
    uniforms:{uSize:{value:size},uTint:{value:new THREE.Vector3(tint[0],tint[1],tint[2])},uPhase:U.uPhase,uProj:U.uProj,uPR:U.uPR},
    vertexShader:[
      'attribute vec3 aOrb; attribute float aShade; uniform float uSize; uniform vec3 uTint; uniform float uPhase; uniform float uProj; uniform float uPR; varying vec3 vCol;',
      'void main(){',
      '  float ang = aOrb.y + uPhase*pow(11.5/aOrb.x,1.5);',
      '  vec3 p = vec3(cos(ang)*aOrb.x, aOrb.z, sin(ang)*aOrb.x);',
      '  vec4 mv = viewMatrix*vec4(p,1.);',
      '  gl_Position = projectionMatrix*mv;',
      '  gl_PointSize = max(uSize*aShade*uProj/(-mv.z), 1.5*uPR);',
      '  vCol = uTint*(0.45+0.75*aShade);',
      '}'].join('\n'),
    fragmentShader:FRAG});
}
var coronaMat=new THREE.ShaderMaterial({
  uniforms:{uR:{value:3},uTime:U.uTime,uProj:U.uProj,uPR:U.uPR},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:[
    'attribute vec3 aDir; attribute float aPh; uniform float uR; uniform float uTime; uniform float uProj; uniform float uPR; varying vec3 vCol; varying float vA;',
    'void main(){',
    '  float t = fract(uTime*0.06 + aPh);',
    '  float r = uR*(1.015 + 0.65*t*t + 0.25*t);',
    '  vec3 p = aDir*r + aDir*0.05*sin(uTime*2. + aPh*40.);',
    '  vec4 mv = viewMatrix*modelMatrix*vec4(p,1.);',
    '  gl_Position = projectionMatrix*mv;',
    '  gl_PointSize = max(0.09*uProj/(-mv.z), 1.4*uPR);',
    '  vA = pow(1.-t,1.8)*0.85;',
    '  vCol = mix(vec3(1.,0.97,0.75), vec3(1.,0.4,0.06), t*t);',
    '}'].join('\n'),
  fragmentShader:FRAGA
});
var loopMat=new THREE.ShaderMaterial({
  uniforms:{uTime:U.uTime,uProj:U.uProj,uPR:U.uPR},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:[
    'attribute float aHt; attribute float aPh; uniform float uTime; uniform float uProj; uniform float uPR; varying vec3 vCol; varying float vA;',
    'void main(){',
    '  vec4 mv = viewMatrix*modelMatrix*vec4(position,1.);',
    '  gl_Position = projectionMatrix*mv;',
    '  gl_PointSize = max(0.06*uProj/(-mv.z), 1.5*uPR);',
    '  vA = (0.55 + 0.45*sin(uTime*1.2 + aPh*6.283))*0.8;',
    '  vCol = mix(vec3(1.,0.35,0.05), vec3(1.,0.85,0.4), aHt);',
    '}'].join('\n'),
  fragmentShader:FRAGA
});
var starMat=new THREE.ShaderMaterial({
  uniforms:{uPR:U.uPR,uTime:U.uTime},transparent:false,depthWrite:false,depthTest:false,
  vertexShader:'attribute vec3 aColor; attribute float aSize; uniform float uPR; uniform float uTime; varying vec3 vCol; void main(){ gl_Position=projectionMatrix*viewMatrix*modelMatrix*vec4(position,1.); float twinkle=0.88+0.12*sin(uTime*1.5+position.x*10.0+position.y*7.0); gl_PointSize=aSize*uPR*twinkle; vCol=aColor*twinkle; }',
  fragmentShader:FRAG
});
var oortMat=new THREE.ShaderMaterial({
  uniforms:{uPR:U.uPR},transparent:false,depthWrite:false,depthTest:true,
  vertexShader:starMat.vertexShader,fragmentShader:FRAG
});
function tailMat(){
  return new THREE.ShaderMaterial({
    uniforms:{uPos:{value:new THREE.Vector3()},uAnti:{value:new THREE.Vector3(1,0,0)},uCurve:{value:new THREE.Vector3(0,0,1)},uLen:{value:10},uAct:{value:1},uTime:U.uTime,uProj:U.uProj,uPR:U.uPR},
    transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:[
      'attribute float aT; attribute vec3 aSide; attribute float aType; attribute float aPh;',
      'uniform vec3 uPos; uniform vec3 uAnti; uniform vec3 uCurve; uniform float uLen; uniform float uAct; uniform float uTime; uniform float uProj; uniform float uPR; varying vec3 vCol; varying float vA;',
      'void main(){',
      '  float t = fract(aT + uTime*(0.05 + aPh*0.06));',
      '  float ion = step(0.5, aType);',
      '  float len = uLen*t*mix(0.65,1.,ion);',
      '  float spread = 0.05 + t*uLen*mix(0.11,0.025,ion);',
      '  vec3 p = uPos + uAnti*len + aSide*spread + uCurve*t*t*uLen*0.22*(1.-ion);',
      '  vec4 mv = viewMatrix*vec4(p,1.);',
      '  gl_Position = projectionMatrix*mv;',
      '  gl_PointSize = max(0.07*uProj/(-mv.z), 1.3*uPR);',
      '  vA = pow(1.-t,1.4)*uAct*0.85;',
      '  vCol = mix(vec3(1.,0.9,0.7), vec3(0.45,0.75,1.), ion);',
      '}'].join('\n'),
    fragmentShader:FRAGA});
}
function comaMat(){
  return new THREE.ShaderMaterial({
    uniforms:{uAct:{value:1},uProj:U.uProj,uPR:U.uPR},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
    vertexShader:[
      'attribute float aRad; uniform float uAct; uniform float uProj; uniform float uPR; varying vec3 vCol; varying float vA;',
      'void main(){',
      '  vec3 p = position*(0.6 + 0.6*uAct);',
      '  vec4 mv = viewMatrix*modelMatrix*vec4(p,1.);',
      '  gl_Position = projectionMatrix*mv;',
      '  gl_PointSize = max(0.05*uProj/(-mv.z), 1.3*uPR);',
      '  vA = uAct*(1. - aRad)*0.8; vCol = mix(vec3(0.7,0.92,1.), vec3(1.,0.95,0.8), aRad);',
      '}'].join('\n'),
    fragmentShader:FRAGA});
}

function ptsGeo(pos,col,glow){
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('aColor',new THREE.BufferAttribute(col,3));
  g.setAttribute('aGlow',new THREE.BufferAttribute(glow||new Float32Array(pos.length),3));
  return g;
}
function mkPoints(g,m){var p=new THREE.Points(g,m);p.frustumCulled=false;return p;}
function rdir(){var u=R()*2-1,a=R()*TAU,s=Math.sqrt(1-u*u);return [s*Math.cos(a),u,s*Math.sin(a)];}

// ---------- background: stars + milky way + Oort cloud ----------
(function(){
  var ns=Math.round(5500*CM),nm=Math.round(10000*CM),n=ns+nm;
  var pos=new Float32Array(n*3),col=new Float32Array(n*3),sz=new Float32Array(n);
  for(var i=0;i<ns;i++){
    var d=rdir(),b=0.35+Math.pow(R(),3)*0.65,tint=R();
    pos[i*3]=d[0]*1500;pos[i*3+1]=d[1]*1500;pos[i*3+2]=d[2]*1500;
    col[i*3]=b*(0.85+tint*0.15);col[i*3+1]=b*0.9;col[i*3+2]=b*(1-tint*0.25);
    sz[i]=1+Math.pow(R(),4)*1.6;
  }
  var nrm=[0.3,0.85,0.4],nl=Math.hypot(nrm[0],nrm[1],nrm[2]);nrm=[nrm[0]/nl,nrm[1]/nl,nrm[2]/nl];
  var k=ns;
  while(k<n){
    var e=rdir(),dp=e[0]*nrm[0]+e[1]*nrm[1]+e[2]*nrm[2];
    if(R()>Math.exp(-(dp/0.16)*(dp/0.16)))continue;
    var g=0.16+R()*0.22;
    pos[k*3]=e[0]*1500;pos[k*3+1]=e[1]*1500;pos[k*3+2]=e[2]*1500;
    col[k*3]=g*0.8;col[k*3+1]=g*0.88;col[k*3+2]=g*1.1;sz[k]=1;k++;
  }
  var geo=ptsGeo(pos,col);geo.setAttribute('aSize',new THREE.BufferAttribute(sz,1));
  var st=mkPoints(geo,starMat);st.renderOrder=-10;st.name='stars';scene.add(st);

  // Oort cloud: faint spherical shell of icy bodies
  var no=Math.round(6000*CM),op=new Float32Array(no*3),oc=new Float32Array(no*3),os=new Float32Array(no);
  for(var j=0;j<no;j++){var d2=rdir(),r=130+R()*70,b2=0.18+R()*0.3;
    op[j*3]=d2[0]*r;op[j*3+1]=d2[1]*r;op[j*3+2]=d2[2]*r;
    oc[j*3]=b2*0.75;oc[j*3+1]=b2*0.9;oc[j*3+2]=b2*1.2;os[j]=1.2+R()*1.3;}
  var og=ptsGeo(op,oc);og.setAttribute('aSize',new THREE.BufferAttribute(os,1));
  scene.add(mkPoints(og,oortMat));
})();

// ---------- data ----------
var EQ=true;
var DATA=[
 {id:'sun',name:'Sun',type:'Star',r:3.0,n:36000,fn:cSun,emit:1,accent:'#ffb02e',spin:0.03,group:0,
  stats:[['Diameter','1.39M km'],['Surface','5,500 Â°C'],['Age','4.6 bn yrs']],fact:'Holds 99.86% of the solar system\'s mass. Everything else orbits it.'},
 {id:'mercury',name:'Mercury',type:'Planet',r:0.35,n:12000,fn:cMercury,d:6,P:88,spin:0.05,tilt:0,incl:7,accent:'#b5b0a8',group:0,
  stats:[['Diameter','4,879 km'],['From Sun','57.9M km'],['Year','88 days'],['Spin','58.6 days'],['Temp','167 Â°C avg'],['Moons','0']],fact:'The smallest planet. Days are scorching and nights drop to about âˆ’180 Â°C.'},
 {id:'venus',name:'Venus',type:'Planet',r:0.6,n:16000,fn:cVenus,d:8.5,P:225,spin:-0.05,tilt:177,incl:3.4,accent:'#e8c27a',group:0,atmo:{c:[1,0.82,0.45],s:0.85,k:1.04},
  stats:[['Diameter','12,104 km'],['From Sun','108M km'],['Year','225 days'],['Spin','243 days'],['Temp','464 Â°C'],['Moons','0']],fact:'The hottest planet, and it spins backwards compared with most others.'},
 {id:'earth',name:'Earth',type:'Planet',r:0.65,n:36000,fn:cEarth,d:11.5,P:365.25,spin:0.35,tilt:23.4,incl:0,accent:'#4da3ff',group:0,atmo:{c:[0.3,0.55,1],s:1.0,k:1.035},
  stats:[['Diameter','12,742 km'],['From Sun','149.6M km'],['Year','365.25 days'],['Spin','23.9 hours'],['Temp','15 Â°C avg'],['Moons','1']],fact:'The only known world with liquid water on its surface, and the only one known to host life. Look for city lights on the night side.',
  moons:[{id:'moon',name:'Moon',type:'Moon of Earth',r:0.18,n:4000,fn:cMoon,d:1.6,P:27.3,accent:'#cfcfcf',stats:[['Diameter','3,474 km'],['From Earth','384,400 km'],['Orbit','27.3 days']],fact:'The only place beyond Earth that humans have visited.'}]},
 {id:'mars',name:'Mars',type:'Planet',r:0.45,n:18000,fn:cMars,d:15,P:687,spin:0.34,tilt:25,incl:1.9,accent:'#e0603a',group:0,eq:EQ,atmo:{c:[0.95,0.6,0.42],s:0.35,k:1.03},
  stats:[['Diameter','6,779 km'],['From Sun','227.9M km'],['Year','687 days'],['Spin','24.6 hours'],['Temp','âˆ’65 Â°C avg'],['Moons','2']],fact:'Home to Olympus Mons, a volcano about 22 km high, the tallest known in the solar system.',
  moons:[
   {id:'phobos',name:'Phobos',type:'Moon of Mars',r:0.07,n:1500,fn:cPhobos,squash:[1.3,0.95,0.85],rough:0.1,d:1.0,P:0.32,accent:'#a39a90',stats:[['Diameter','22 km'],['From Mars','9,376 km'],['Orbit','7.7 hours']],fact:'Orbits so close it circles Mars three times a day, and it is slowly spiralling inward.'},
   {id:'deimos',name:'Deimos',type:'Moon of Mars',r:0.05,n:1200,fn:cDeimos,squash:[1.2,0.9,0.9],rough:0.1,d:1.6,P:1.26,accent:'#b5aa9c',stats:[['Diameter','12 km'],['From Mars','23,460 km'],['Orbit','30.3 hours']],fact:'The smaller of Mars\'s two moons, a lumpy captured-looking rock.'}]},
 {id:'jupiter',name:'Jupiter',type:'Gas giant',r:1.9,n:38000,fn:cJupiter,d:24,P:4333,spin:0.85,tilt:3,incl:1.3,accent:'#d9a066',group:0,eq:EQ,atmo:{c:[0.95,0.8,0.6],s:0.32,k:1.025},
  stats:[['Diameter','139,820 km'],['From Sun','778.5M km'],['Year','11.9 years'],['Spin','9.9 hours'],['Temp','âˆ’110 Â°C'],['Moons','95+']],fact:'Its Great Red Spot is a storm larger than Earth that has raged for centuries.',
  moons:[
   {id:'io',name:'Io',type:'Moon of Jupiter',r:0.16,n:3000,fn:cIo,d:3.0,P:1.77,accent:'#f0d04a',stats:[['Diameter','3,643 km'],['From Jupiter','421,700 km'],['Orbit','1.77 days']],fact:'The most volcanically active body in the solar system. Glowing spots mark its volcanoes.'},
   {id:'europa',name:'Europa',type:'Moon of Jupiter',r:0.14,n:2800,fn:cEuropa,d:3.7,P:3.55,accent:'#e6dcc4',stats:[['Diameter','3,122 km'],['From Jupiter','671,000 km'],['Orbit','3.55 days']],fact:'Hides a global ocean beneath its icy, cracked crust.'},
   {id:'ganymede',name:'Ganymede',type:'Moon of Jupiter',r:0.21,n:3400,fn:cGanymede,d:4.6,P:7.15,accent:'#b9ada0',stats:[['Diameter','5,268 km'],['From Jupiter','1.07M km'],['Orbit','7.15 days']],fact:'The largest moon in the solar system, bigger than Mercury.'},
   {id:'callisto',name:'Callisto',type:'Moon of Jupiter',r:0.19,n:3200,fn:cCallisto,d:5.7,P:16.7,accent:'#7a7268',stats:[['Diameter','4,821 km'],['From Jupiter','1.88M km'],['Orbit','16.7 days']],fact:'One of the most heavily cratered surfaces known.'}]},
 {id:'saturn',name:'Saturn',type:'Gas giant',r:1.6,n:30000,fn:cSaturn,d:33,P:10759,spin:0.8,tilt:27,incl:2.5,accent:'#e6cf94',ring:true,group:0,eq:EQ,atmo:{c:[0.95,0.85,0.6],s:0.28,k:1.025},
  stats:[['Diameter','116,460 km'],['From Sun','1.43B km'],['Year','29.4 years'],['Spin','10.7 hours'],['Temp','âˆ’140 Â°C'],['Moons','270+']],fact:'Its rings are mostly water ice and are extremely thin compared with their width. They also cast a shadow on the planet.',
  moons:[
   {id:'enceladus',name:'Enceladus',type:'Moon of Saturn',r:0.08,n:1800,fn:cEnceladus,d:4.4,P:1.37,accent:'#dfefff',stats:[['Diameter','504 km'],['From Saturn','238,000 km'],['Orbit','1.37 days']],fact:'Sprays plumes of water ice into space from an ocean beneath its shell.'},
   {id:'rhea',name:'Rhea',type:'Moon of Saturn',r:0.13,n:2400,fn:cRhea,d:5.6,P:4.52,accent:'#b8b4ac',stats:[['Diameter','1,527 km'],['From Saturn','527,000 km'],['Orbit','4.52 days']],fact:'Saturn\'s second-largest moon, a heavily cratered ball of ice.'},
   {id:'titan',name:'Titan',type:'Moon of Saturn',r:0.28,n:5000,fn:cTitan,d:7.6,P:15.9,accent:'#e0a04a',atmo:{c:[0.95,0.62,0.22],s:0.9,k:1.06},stats:[['Diameter','5,150 km'],['From Saturn','1.22M km'],['Orbit','15.9 days']],fact:'Has a thick orange atmosphere and lakes of liquid methane.'},
   {id:'iapetus',name:'Iapetus',type:'Moon of Saturn',r:0.13,n:2400,fn:cIapetus,d:10.4,P:79.3,accent:'#cfcabf',stats:[['Diameter','1,469 km'],['From Saturn','3.56M km'],['Orbit','79 days']],fact:'Two-faced: one hemisphere is coal-dark and the other is bright as ice.'}]},
 {id:'uranus',name:'Uranus',type:'Ice giant',r:1.05,n:18000,fn:cUranus,d:41,P:30687,spin:-0.5,tilt:98,incl:0.8,accent:'#7fe0e6',uring:true,group:0,eq:EQ,atmo:{c:[0.6,0.95,0.95],s:0.55,k:1.03},
  stats:[['Diameter','50,724 km'],['From Sun','2.87B km'],['Year','84 years'],['Spin','17.2 hours'],['Temp','âˆ’195 Â°C'],['Moons','28']],fact:'Rolls around the Sun tilted about 98Â°, almost on its side.',
  moons:[
   {id:'miranda',name:'Miranda',type:'Moon of Uranus',r:0.06,n:1300,fn:cMiranda,d:2.5,P:1.41,accent:'#c8c8cc',stats:[['Diameter','470 km'],['From Uranus','129,900 km'],['Orbit','1.41 days']],fact:'Has giant cliffs and a patchwork surface, as if it was broken apart and reassembled.'},
   {id:'ariel',name:'Ariel',type:'Moon of Uranus',r:0.09,n:1600,fn:cAriel,d:3.0,P:2.52,accent:'#d0d0d0',stats:[['Diameter','1,158 km'],['From Uranus','190,900 km'],['Orbit','2.52 days']],fact:'The brightest of Uranus\'s major moons, cut by deep valleys.'},
   {id:'umbriel',name:'Umbriel',type:'Moon of Uranus',r:0.09,n:1600,fn:cUmbriel,d:3.5,P:4.14,accent:'#7d7d7d',stats:[['Diameter','1,169 km'],['From Uranus','266,000 km'],['Orbit','4.14 days']],fact:'The darkest of the big Uranian moons.'},
   {id:'titania',name:'Titania',type:'Moon of Uranus',r:0.12,n:2000,fn:cTitania,d:4.1,P:8.71,accent:'#b9aea4',stats:[['Diameter','1,578 km'],['From Uranus','436,000 km'],['Orbit','8.71 days']],fact:'Uranus\'s largest moon.'},
   {id:'oberon',name:'Oberon',type:'Moon of Uranus',r:0.11,n:1900,fn:cOberon,d:4.8,P:13.46,accent:'#a39a94',stats:[['Diameter','1,523 km'],['From Uranus','583,500 km'],['Orbit','13.5 days']],fact:'An old, cratered world on the outer edge of Uranus\'s big moons.'}]},
 {id:'neptune',name:'Neptune',type:'Ice giant',r:1.0,n:18000,fn:cNeptune,d:48,P:60190,spin:0.5,tilt:28,incl:1.8,accent:'#4a6bff',group:0,eq:EQ,atmo:{c:[0.3,0.5,1],s:0.7,k:1.03},
  stats:[['Diameter','49,244 km'],['From Sun','4.50B km'],['Year','164.8 years'],['Spin','16.1 hours'],['Temp','âˆ’200 Â°C'],['Moons','16']],fact:'Winds here are the fastest measured on any planet, over 2,000 km/h.',
  moons:[{id:'triton',name:'Triton',type:'Moon of Neptune',r:0.17,n:3200,fn:cTriton,d:2.7,P:-5.88,accent:'#e6cfcc',stats:[['Diameter','2,707 km'],['From Neptune','354,800 km'],['Orbit','5.88 days (backwards)']],fact:'Orbits Neptune backwards, which suggests it was captured from the Kuiper belt.'}]},

 {id:'ceres',name:'Ceres',type:'Dwarf planet',r:0.13,n:2600,fn:cCeres,rough:0.03,d:19.6,P:1682,spin:0.3,tilt:4,incl:10.6,accent:'#b3b3ac',group:1,minor:true,
  stats:[['Diameter','940 km'],['From Sun','414M km'],['Year','4.6 years'],['Spin','9.1 hours'],['Temp','âˆ’105 Â°C'],['Moons','0']],fact:'The largest object in the asteroid belt and the only dwarf planet in the inner solar system.'},
 {id:'pluto',name:'Pluto',type:'Dwarf planet',r:0.22,n:6000,fn:cPluto,d:55,P:90560,spin:0.12,tilt:120,incl:17,accent:'#d8b8a0',group:1,eq:EQ,atmo:{c:[0.5,0.65,1],s:0.3,k:1.04},minor:true,
  stats:[['Diameter','2,377 km'],['From Sun','5.9B km'],['Year','248 years'],['Spin','6.4 days'],['Temp','âˆ’230 Â°C'],['Moons','5']],fact:'Reclassified as a dwarf planet in 2006. Its pale heart-shaped plain is easy to spot.',
  moons:[{id:'charon',name:'Charon',type:'Moon of Pluto',r:0.11,n:2200,fn:cCharon,d:0.8,P:6.39,accent:'#b5aaa6',stats:[['Diameter','1,212 km'],['From Pluto','19,600 km'],['Orbit','6.39 days']],fact:'Half the size of Pluto, so the two orbit a point between them.'}]},
 {id:'haumea',name:'Haumea',type:'Dwarf planet',r:0.14,n:2600,fn:cHaumea,squash:[1.6,0.8,0.95],d:58,P:103400,spin:1.6,tilt:0,incl:28,accent:'#d8dcea',group:1,minor:true,
  stats:[['Length','~1,600 km'],['From Sun','6.5B km'],['Year','285 years'],['Spin','3.9 hours'],['Temp','âˆ’241 Â°C'],['Moons','2']],fact:'Spins so fast that it is stretched into an egg shape.'},
 {id:'makemake',name:'Makemake',type:'Dwarf planet',r:0.14,n:2600,fn:cMakemake,d:61,P:111400,spin:0.2,tilt:0,incl:29,accent:'#d08a5a',group:1,minor:true,
  stats:[['Diameter','1,430 km'],['From Sun','6.8B km'],['Year','305 years'],['Spin','22.8 hours'],['Temp','âˆ’239 Â°C'],['Moons','1']],fact:'One of the brightest objects in the Kuiper belt, with a reddish surface.'},
 {id:'eris',name:'Eris',type:'Dwarf planet',r:0.2,n:3600,fn:cEris,d:70,P:203830,spin:0.1,tilt:0,incl:44,accent:'#e8e8f0',group:1,minor:true,
  stats:[['Diameter','2,326 km'],['From Sun','10.2B km'],['Year','559 years'],['Spin','25.9 hours'],['Temp','âˆ’231 Â°C'],['Moons','1']],fact:'Almost Pluto\'s size but more massive. Its discovery led to Pluto being reclassified.'},

 {id:'halley',name:'Halley\'s Comet',type:'Comet',r:0.16,n:1400,fn:cComet,squash:[1.3,0.85,0.9],rough:0.2,comet:{q:5.5,Q:62,tail:30},P:-27760,spin:0.1,incl:162,argP:1.0,accent:'#8fd0ff',group:2,minor:true,ang0:0.5,
  stats:[['Nucleus','~15 km'],['Period','~76 years'],['Last visit','1986'],['Next visit','2061'],['Orbit','Backwards'],['Tail','Up to 100M km']],fact:'The most famous comet. Its tail always points away from the Sun and grows as it approaches.'},
 {id:'encke',name:'Comet Encke',type:'Comet',r:0.12,n:1100,fn:cComet,squash:[1.2,0.9,0.9],rough:0.2,comet:{q:6.5,Q:20,tail:12},P:1204,spin:0.15,incl:11,argP:2.0,accent:'#8fd0ff',group:2,minor:true,ang0:1.5,
  stats:[['Nucleus','~5 km'],['Period','3.3 years'],['Orbit','Inside Jupiter\'s'],['Type','Short-period']],fact:'Has one of the shortest orbits of any known comet, returning every 3.3 years.'},
 {id:'voyager1',name:'Voyager 1',type:'Spacecraft',r:0.5,probe:true,pos:[-62,50,-48],accent:'#ffd98a',group:2,minor:true,
  stats:[['Launched','1977'],['Distance','24B+ km'],['Speed','~17 km/s'],['Status','Interstellar']],fact:'The farthest human-made object. It left the Sun\'s bubble in 2012 and is still sending data home.'},
 {id:'voyager2',name:'Voyager 2',type:'Spacecraft',r:0.5,probe:true,pos:[52,-44,58],accent:'#ffd98a',group:2,minor:true,
  stats:[['Launched','1977'],['Distance','20B+ km'],['Speed','~15 km/s'],['Status','Interstellar']],fact:'The only spacecraft to have visited all four giant planets.'},

 {id:'belt',name:'Asteroid belt',type:'Region',virtual:true,r:2,focusR:46,accent:'#b8a58c',group:3,
  stats:[['Location','Mars to Jupiter'],['Objects','Millions'],['Total mass','~3% of Moon']],fact:'Rocky leftovers from the birth of the solar system that never merged into a planet. Ceres and Vesta live here.'},
 {id:'kuiper',name:'Kuiper belt',type:'Region',virtual:true,r:2,focusR:135,accent:'#8fb0d8',group:3,
  stats:[['Location','Beyond Neptune'],['Objects','100,000+ big ones'],['Home of','Pluto, Eris, Haumea']],fact:'A wide ring of icy bodies beyond Neptune, and the source of many short-period comets.'},
 {id:'oort',name:'Oort cloud',type:'Region',virtual:true,r:2,focusR:380,accent:'#7aa0d0',group:3,
  stats:[['Location','Far outer edge'],['Reach','Up to ~1 light-year'],['Status','Never seen directly']],fact:'A vast, thin shell of icy bodies thought to send long-period comets like Halley\'s inward. Shown here far closer than it really is.'}
];

// ---------- build ----------
var world=new THREE.Group();scene.add(world);
var bodies=[],mains=[],labelsEl=document.getElementById('labels');
function scaleN(n){return Math.max(500,Math.round(n*CM));}
function circleLine(radius,color,op){
  var seg=256,p=new Float32Array(seg*3);
  for(var i=0;i<seg;i++){var a=i/seg*TAU;p[i*3]=Math.cos(a)*radius;p[i*3+1]=0;p[i*3+2]=Math.sin(a)*radius;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  return new THREE.LineLoop(g,new THREE.LineBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:op}));
}
function ellipseLine(q,Q,color,op){
  var a=(q+Q)/2,e=(Q-q)/(Q+q),bb=a*Math.sqrt(1-e*e),seg=400,p=new Float32Array(seg*3);
  for(var i=0;i<seg;i++){var E=i/seg*TAU;p[i*3]=a*(Math.cos(E)-e);p[i*3+1]=0;p[i*3+2]=bb*Math.sin(E);}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
  return new THREE.LineLoop(g,new THREE.LineBasicMaterial({color:new THREE.Color(color),transparent:true,opacity:op}));
}
function mkLabel(d,moon){var el=document.createElement('div');el.className='label'+((moon||d.minor)?' moon':'');el.textContent=d.name;labelsEl.appendChild(el);return el;}

function probeData(){
  var n=1400,pos=new Float32Array(n*3),col=new Float32Array(n*3),k=0;
  function add(x,y,z,c){if(k>=n)return;pos[k*3]=x;pos[k*3+1]=y;pos[k*3+2]=z;col[k*3]=c[0];col[k*3+1]=c[1];col[k*3+2]=c[2];k++;}
  var i,a,r;
  for(i=0;i<560;i++){a=R()*TAU;r=0.34*Math.sqrt(R());add(Math.cos(a)*r,0.22*(r/0.34)*(r/0.34)+0.1,Math.sin(a)*r,[0.9,0.9,0.92]);}   // dish
  for(i=0;i<240;i++){a=R()*TAU;r=0.11*Math.sqrt(R());add(Math.cos(a)*r,-0.02*R(),Math.sin(a)*r,[0.85,0.7,0.35]);}                // bus
  for(i=0;i<160;i++){var t=R();add(0.1+t*0.65,-0.02+(R()-0.5)*0.01,(R()-0.5)*0.01,[0.9,0.85,0.7]);}                             // boom
  for(i=0;i<90;i++){var t2=R();add(-0.1-t2*0.5,-0.02,(R()-0.5)*0.01,[0.85,0.8,0.7]);}                                          // rtg boom
  for(i=0;i<70;i++){var t3=R();add((R()-0.5)*0.01,0.32+t3*0.25,(R()-0.5)*0.01,[1,0.95,0.8]);}                                  // antenna
  return {pos:pos.subarray(0,k*3),col:col.subarray(0,k*3)};
}

function buildBody(d,parentHolder,parentBody,inclG){
  var holder=new THREE.Group();parentHolder.add(holder);
  var b={d:d,holder:holder,inclG:inclG||null,ang:(d.ang0!==undefined?d.ang0:R()*TAU),wp:new THREE.Vector3(),parent:parentBody||null,moons:[],
         focusR:6,label:null,line:null,px:0,py:0,pr:0,vis:false,dist:0,spinG:new THREE.Group(),tail:null};
  bodies.push(b);
  if(d.virtual){b.focusR=d.focusR;return b;}
  b.label=mkLabel(d,!!parentBody);
  var tiltG=new THREE.Group();tiltG.rotation.z=(d.tilt||0)*Math.PI/180;holder.add(tiltG);
  var spinG=b.spinG;tiltG.add(spinG);
  if(d.probe){
    var pd=probeData(),pp=mkPoints(ptsGeo(pd.pos,pd.col),bodyMat(0.03,1,0));spinG.add(pp);
    var to=Math.hypot(d.pos[0],d.pos[1],d.pos[2]);
    holder.position.set(d.pos[0],d.pos[1],d.pos[2]);
    holder.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),new THREE.Vector3(-d.pos[0]/to,-d.pos[1]/to,-d.pos[2]/to));
    b.focusR=3.5;b.fixed=true;return b;
  }
  var geo = new THREE.SphereGeometry(d.r, 128, 64);
  if (d.squash) geo.scale(d.squash[0], d.squash[1], d.squash[2]);

  var mat;
  if (d.id === 'earth') {
    var tl = new THREE.TextureLoader();
    mat = new THREE.MeshStandardMaterial({
      map: tl.load(TEX_EARTH),
      bumpMap: tl.load(TEX_BUMP),
      bumpScale: 0.04,
      metalnessMap: tl.load(TEX_WATER),
      roughness: 0.7,
      metalness: 0.5
    });
  } else if (d.emit) {
    mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: U.uTime
      },
      vertexShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        void main() {
          vPosition = position;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        varying vec3 vPosition;
        varying vec3 vNormal;
        
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
                     i.z + vec4(0.0, i1.z, i2.z, 1.0))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        float fbm(vec3 p) {
            float f = 0.0;
            float w = 0.5;
            for(int i = 0; i < 4; i++) {
                f += w * snoise(p);
                p *= 2.0;
                w *= 0.5;
            }
            return f;
        }
        void main() {
            vec3 p = normalize(vPosition) * 4.0;
            float t = uTime * 0.2;
            
            float n1 = fbm(p + vec3(t, t, t));
            float n2 = fbm(p * 2.0 - vec3(t, t*1.5, t));
            float noise = fbm(p + n1 * 2.0 + n2);
            
            vec3 col1 = vec3(0.6, 0.0, 0.0);
            vec3 col2 = vec3(1.0, 0.3, 0.0);
            vec3 col3 = vec3(1.0, 0.8, 0.1);
            vec3 col4 = vec3(1.0, 1.0, 0.8);
            
            float intensity = noise * 0.5 + 0.5;
            vec3 color;
            if (intensity < 0.4) color = mix(col1, col2, intensity / 0.4);
            else if (intensity < 0.7) color = mix(col2, col3, (intensity - 0.4) / 0.3);
            else color = mix(col3, col4, (intensity - 0.7) / 0.3);
            
            float limb = clamp(dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
            color = mix(color * 0.3, color, pow(limb, 0.6));
            
            color += pow(limb, 4.0) * vec3(0.3, 0.2, 0.1);
            
            gl_FragColor = vec4(color, 1.0);
        }
      `
    });
  } else {
    var res = Math.max(256, Math.min(1024, Math.round(d.r * 800)));
    var w = res;
    var h = Math.round(res / 2);
    
    var canvasD = document.createElement('canvas');
    canvasD.width = w; canvasD.height = h;
    var ctxD = canvasD.getContext('2d');
    var imgD = ctxD.createImageData(w, h);
    
    var hasBump = !!d.rough;
    var canvasB, ctxB, imgB;
    if (hasBump) {
      canvasB = document.createElement('canvas');
      canvasB.width = w; canvasB.height = h;
      ctxB = canvasB.getContext('2d');
      imgB = ctxB.createImageData(w, h);
    }

    for (var y = 0; y < h; y++) {
        var v = y / (h - 1);
        var lat = (0.5 - v) * Math.PI; 
        var cosLat = Math.cos(lat);
        var sinLat = Math.sin(lat);
        for (var x = 0; x < w; x++) {
            var u = x / (w - 1);
            var lon = u * 2 * Math.PI - Math.PI;
            var px = cosLat * Math.cos(lon);
            var pz = -cosLat * Math.sin(lon); 
            var py = sinLat;
            
            var c = d.fn(px, py, pz, lat, lon);
            var idx = (y * w + x) * 4;
            imgD.data[idx] = Math.min(255, c[0] * 255);
            imgD.data[idx + 1] = Math.min(255, c[1] * 255);
            imgD.data[idx + 2] = Math.min(255, c[2] * 255);
            imgD.data[idx + 3] = 255;
            
            if (hasBump) {
                var hgt = (fbm(px * 3 + 1, py * 3, pz * 3, 3) - 0.5) * 2;
                var bVal = Math.max(0, Math.min(255, (hgt * 0.5 + 0.5) * 255));
                imgB.data[idx] = bVal;
                imgB.data[idx + 1] = bVal;
                imgB.data[idx + 2] = bVal;
                imgB.data[idx + 3] = 255;
            }
        }
    }
    ctxD.putImageData(imgD, 0, 0);
    var texD = new THREE.CanvasTexture(canvasD);
    texD.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    mat = new THREE.MeshStandardMaterial({
        map: texD,
        roughness: 0.85,
        metalness: 0.05
    });
    
    if (hasBump) {
        ctxB.putImageData(imgB, 0, 0);
        var texB = new THREE.CanvasTexture(canvasB);
        texB.anisotropy = renderer.capabilities.getMaxAnisotropy();
        mat.bumpMap = texB;
        mat.bumpScale = d.rough * d.r * 0.15;
    }
  }
  var mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = !d.emit;
  mesh.receiveShadow = !d.emit;
  spinG.add(mesh);

  if (d.id === 'sun') {
    var light = new THREE.PointLight(0xffeedd, 3, 0, 0);
    light.castShadow = true;
    light.shadow.mapSize.width = 4096;
    light.shadow.mapSize.height = 4096;
    light.shadow.bias = -0.0005;
    light.shadow.camera.near = 1.0;
    light.shadow.camera.far = 1000;
    holder.add(light);
    var amb = new THREE.AmbientLight(0xffffff, 0.08);
    world.add(amb);
    
    var glowGeo = new THREE.SphereGeometry(d.r * 1.5, 64, 64);
    var glowMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(0xffaa44) } },
      vertexShader: 'varying vec3 vNormal; void main(){ vNormal=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 c; varying vec3 vNormal; void main(){ float i = pow(0.65 - dot(vNormal, vec3(0,0,1)), 3.5); gl_FragColor = vec4(c, 1.0)*i*2.0; }',
      blending: THREE.AdditiveBlending,
      transparent: true,
      depthWrite: false
    });
    var glowMesh = new THREE.Mesh(glowGeo, glowMat);
    holder.add(glowMesh);
  }

  if(d.atmo){
    var atmoGeo = new THREE.SphereGeometry(d.r * d.atmo.k, 64, 64);
    var atmoMatMesh = new THREE.ShaderMaterial({
      uniforms: {
        uCol: { value: new THREE.Vector3(d.atmo.c[0], d.atmo.c[1], d.atmo.c[2]) },
        uStr: { value: d.atmo.s }
      },
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec3 vViewPosition;',
        'void main() {',
        '  vec4 mvPosition = viewMatrix * modelMatrix * vec4(position, 1.0);',
        '  vViewPosition = -mvPosition.xyz;',
        '  vNormal = normalize(normalMatrix * normal);',
        '  gl_Position = projectionMatrix * mvPosition;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform vec3 uCol;',
        'uniform float uStr;',
        'varying vec3 vNormal;',
        'varying vec3 vViewPosition;',
        'void main() {',
        '  vec3 normal = normalize(vNormal);',
        '  vec3 viewDir = normalize(vViewPosition);',
        '  float NdV = abs(dot(normal, viewDir));',
        '  float fresnel = pow(1.0 - NdV, 3.0) * 1.5 + pow(1.0 - NdV, 6.0);',
        '  gl_FragColor = vec4(uCol * fresnel * uStr, fresnel * uStr);',
        '}'
      ].join('\n')
    });
    var atmoMesh = new THREE.Mesh(atmoGeo, atmoMatMesh);
    spinG.add(atmoMesh);
  }
  b.focusR=d.id==='sun'?12:(d.ring?d.r*7.5:(d.comet?7:d.r*5.2));
  if(d.ring){
    var rd=ringData(scaleN(30000),d.r*1.25,d.r*2.35,function(r){
      var f=r/d.r,t=0.6*vnoise(f*38,0.5,0.2)+0.4*vnoise(f*130,1.5,0.7),base=f<1.5?[0.42,0.38,0.32]:(f<1.95?[0.9,0.82,0.66]:[0.72,0.66,0.54]);
      return mul3(base,0.6+t*0.7);
    },function(r){var f=r/d.r;if(f>1.95&&f<2.03)return 0.03;if(f<1.5)return 0.35;if(f<1.95)return 1.0;return 0.7;},0.02);
    tiltG.add(mkPoints(ptsGeo(rd.pos,rd.col),bodyMat(0.05,0,1,d.r)));
  }
  if(d.uring){
    var ur=ringData(scaleN(3000),d.r*1.7,d.r*1.9,function(){return [0.45,0.5,0.52];},function(){return 0.8;},0.01);
    tiltG.add(mkPoints(ptsGeo(ur.pos,ur.col),bodyMat(0.025,0,1)));
  }
  if(d.comet){
    var nc=scaleN(3200),tp=new Float32Array(nc*3),tt=new Float32Array(nc),ts=new Float32Array(nc*3),ty=new Float32Array(nc),tph=new Float32Array(nc);
    for(var j=0;j<nc;j++){var s=rdir(),m=Math.cbrt(R());ts[j*3]=s[0]*m;ts[j*3+1]=s[1]*m;ts[j*3+2]=s[2]*m;tt[j]=R();ty[j]=R()<0.4?1:0;tph[j]=R();}
    var tg=new THREE.BufferGeometry();
    tg.setAttribute('position',new THREE.BufferAttribute(tp,3));tg.setAttribute('aT',new THREE.BufferAttribute(tt,1));
    tg.setAttribute('aSide',new THREE.BufferAttribute(ts,3));tg.setAttribute('aType',new THREE.BufferAttribute(ty,1));tg.setAttribute('aPh',new THREE.BufferAttribute(tph,1));
    var tm=tailMat();world.add(mkPoints(tg,tm));b.tail=tm;
    var nk=scaleN(900),cp=new Float32Array(nk*3),cr=new Float32Array(nk);
    for(var q2=0;q2<nk;q2++){var s2=rdir(),m2=Math.pow(R(),0.6);cp[q2*3]=s2[0]*m2*0.9;cp[q2*3+1]=s2[1]*m2*0.9;cp[q2*3+2]=s2[2]*m2*0.9;cr[q2]=m2;}
    var cg=new THREE.BufferGeometry();cg.setAttribute('position',new THREE.BufferAttribute(cp,3));cg.setAttribute('aRad',new THREE.BufferAttribute(cr,1));
    var cm=comaMat();holder.add(mkPoints(cg,cm));b.coma=cm;
    b.line=ellipseLine(d.comet.q,d.comet.Q,d.accent,0.3);inclG.add(b.line);
    b.ea=(d.comet.q+d.comet.Q)/2;b.ee=(d.comet.Q-d.comet.q)/(d.comet.Q+d.comet.q);b.eb=b.ea*Math.sqrt(1-b.ee*b.ee);
    return b;
  }
  if(d.d){
    b.line=circleLine(d.d,d.accent,parentBody?0.35:0.3);
    if(parentBody)parentHolder.add(b.line);else inclG.add(b.line);
  }
  if(d.moons)d.moons.forEach(function(m){
    var mp=d.eq?tiltG:holder;
    b.moons.push(buildBody(m,mp,b));
  });
  return b;
}
var built=0;
DATA.forEach(function(d){
  var inclG=new THREE.Group();inclG.rotation.x=(d.incl||0)*Math.PI/180;if(d.argP)inclG.rotation.y=d.argP;world.add(inclG);
  var b=buildBody(d,inclG,null,inclG);mains.push(b);
});
var sun=mains[0],jupiter=mains.filter(function(m){return m.d.id==='jupiter';})[0];

// sun corona + prominences
(function(){
  var n=Math.round(2600*CM),dirs=new Float32Array(n*3),ph=new Float32Array(n);
  for(var i=0;i<n;i++){var u=rdir();dirs[i*3]=u[0];dirs[i*3+1]=u[1];dirs[i*3+2]=u[2];ph[i]=R();}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(n*3),3));
  g.setAttribute('aDir',new THREE.BufferAttribute(dirs,3));g.setAttribute('aPh',new THREE.BufferAttribute(ph,1));
  coronaMat.uniforms.uR.value=DATA[0].r;
  sun.holder.add(mkPoints(g,coronaMat));
  // coronal loops
  var arcs=8,per=Math.round(240*CM),m=arcs*per,pos=new Float32Array(m*3),ht=new Float32Array(m),pp=new Float32Array(m),k=0,Rs=DATA[0].r;
  for(var a=0;a<arcs;a++){
    var d0=rdir(),rv=rdir(),tx=d0[1]*rv[2]-d0[2]*rv[1],ty=d0[2]*rv[0]-d0[0]*rv[2],tz=d0[0]*rv[1]-d0[1]*rv[0],tl=Math.hypot(tx,ty,tz)||1;
    tx/=tl;ty/=tl;tz/=tl;
    var L=0.22+R()*0.28,hg=0.16+R()*0.3,ph0=R();
    for(var s=0;s<per;s++){
      var u2=s/(per-1),phi=(u2-0.5)*2*L,h=hg*Math.sin(Math.PI*u2),rr=Rs*(1.0+h)+(R()-0.5)*0.03;
      var cx=d0[0]*Math.cos(phi)+tx*Math.sin(phi),cy=d0[1]*Math.cos(phi)+ty*Math.sin(phi),cz=d0[2]*Math.cos(phi)+tz*Math.sin(phi);
      pos[k*3]=cx*rr;pos[k*3+1]=cy*rr;pos[k*3+2]=cz*rr;ht[k]=Math.sin(Math.PI*u2);pp[k]=ph0;k++;
    }
  }
  var lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  lg.setAttribute('aHt',new THREE.BufferAttribute(ht,1));lg.setAttribute('aPh',new THREE.BufferAttribute(pp,1));
  sun.spinG.add(mkPoints(lg,loopMat));
})();
// belts
function makeBelt(n,r0,r1,thick,size,tint){
  n=Math.round(n*CM);
  var orb=new Float32Array(n*3),sh=new Float32Array(n),pos=new Float32Array(n*3);
  for(var i=0;i<n;i++){orb[i*3]=r0+(r1-r0)*Math.pow(R(),0.9);orb[i*3+1]=R()*TAU;orb[i*3+2]=(R()-0.5)*thick*(0.4+R());sh[i]=0.35+R()*0.75;}
  var g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));
  g.setAttribute('aOrb',new THREE.BufferAttribute(orb,3));g.setAttribute('aShade',new THREE.BufferAttribute(sh,1));
  var p=mkPoints(g,beltMat(size,tint));world.add(p);return p;
}
makeBelt(11000,17.6,21.6,0.9,0.075,[0.72,0.64,0.55]);
makeBelt(4500,50,72,2.4,0.09,[0.5,0.6,0.75]);
// Jupiter Trojans (follow Jupiter's orbit 60 degrees ahead and behind)
var trojans=[];
(function(){
  [1,-1].forEach(function(sgn){
    var g=new THREE.Group();jupiter.inclG.add(g);
    var n=Math.round(1500*CM),pos=new Float32Array(n*3),col=new Float32Array(n*3),r0=jupiter.d.d;
    for(var i=0;i<n;i++){var phi=(R()-0.5+ (R()-0.5))*0.4,rr=r0+(R()-0.5)*1.6,gg=0.35+R()*0.35;
      pos[i*3]=Math.cos(phi)*rr;pos[i*3+1]=(R()-0.5)*0.8;pos[i*3+2]=Math.sin(phi)*rr;col[i*3]=gg;col[i*3+1]=gg*0.92;col[i*3+2]=gg*0.82;}
    g.add(mkPoints(ptsGeo(pos,col),bodyMat(0.06,0.8,0)));
    trojans.push({g:g,off:sgn*Math.PI/3});
  });
})();

// ---------- camera state ----------
var MAXR=430;
var cam={theta:0.6,phi:1.12,r:260,rT:100,tx:0,ty:0,tz:0,vT:0,vP:0,phiG:null,viewOff:0};
var focus=null,idle=0,ZERO=new THREE.Vector3();
function overviewR(){var a=innerWidth/innerHeight;return Math.min(250,Math.max(95,120/(2*Math.tan(FOV*Math.PI/360)*a*0.9)));}
function minR(){return focus?focus.d.r*1.5+(focus.d.ring?focus.d.r*1.5:0):6;}
function clampR(v){return clamp(v,minR(),MAXR);}
cam.rT=overviewR();

// ---------- UI ----------
var cardEl=document.getElementById('card'),chipsEl=document.getElementById('chips'),hintEl=document.getElementById('hint');
var speedEl=document.getElementById('speed'),speedOut=document.getElementById('speedOut'),pauseBtn=document.getElementById('bPause'),cinematicBtn=document.getElementById('bCinematic');
var orbitsOn=true,labelsOn=true,paused=false,cinematic=false;
function speedDays(){var v=+speedEl.value;return v===0?0:Math.pow(10,v/25);}
function fmtSpeed(){var s=speedDays();if(paused||s===0)return 'paused';if(s<365)return (s<10?s.toFixed(1):Math.round(s))+' days/s';return (s/365.25).toFixed(1)+' yrs/s';}
function updSpeed(){speedOut.textContent=fmtSpeed();pauseBtn.textContent=paused?'Play':'Pause';}
speedEl.addEventListener('input',function(){paused=false;updSpeed();});
pauseBtn.addEventListener('click',function(){paused=!paused;updSpeed();});
cinematicBtn.addEventListener('click',function(){
  cinematic=!cinematic;
  cinematicBtn.style.background=cinematic?'var(--accent)':'';
  cinematicBtn.style.color=cinematic?'#000':'';
  if(cinematic){ chipsEl.style.opacity=0; document.body.classList.add('labels-off'); }
  else { chipsEl.style.opacity=1; document.body.classList.remove('labels-off'); }
});
updSpeed();

var lastGroup=0;
mains.forEach(function(b){
  if(b.d.group!==lastGroup){var sp=document.createElement('span');sp.className='sep';chipsEl.appendChild(sp);lastGroup=b.d.group;}
  var c=document.createElement('button');c.className='chip glass';c.style.setProperty('--c',b.d.accent);
  c.innerHTML='<i></i>'+b.d.name;c.addEventListener('click',function(){focusOn(b);});
  b.chip=c;chipsEl.appendChild(c);
});
function hideHint(){hintEl.classList.add('hide');}
function showCard(b){
  var d=b.d;
  var st=d.stats.map(function(s){return '<div><small>'+s[0]+'</small><span>'+s[1]+'</span></div>';}).join('');
  cardEl.innerHTML='<div class="ch"><div><span class="ty">'+d.type+'</span><h3>'+d.name+'</h3></div><button class="x" aria-label="Close">&times;</button></div><div class="card-divider"></div><div class="stats">'+st+'</div><p>'+d.fact+'</p>';
  cardEl.classList.add('show');
  cardEl.querySelector('.x').addEventListener('click',function(){focusOn(null);});
}
function focusOn(b){
  focus=b;cam.phiG=null;idle=0;
  document.documentElement.style.setProperty('--accent',b?b.d.accent:'#ffb02e');
  var top=b?(b.parent||b):null;
  mains.forEach(function(m){m.chip.classList.toggle('on',m===top);});
  if(b){
    cam.rT=b.focusR;showCard(b);hideHint();
    if(top&&top.chip)top.chip.scrollIntoView({inline:'center',block:'nearest',behavior:'smooth'});
  }else{
    cam.rT=overviewR();cam.phiG=1.12;cardEl.classList.remove('show');
  }
}
document.getElementById('bOver').addEventListener('click',function(){focusOn(null);});
document.getElementById('bOrb').addEventListener('click',function(e){orbitsOn=!orbitsOn;e.currentTarget.setAttribute('aria-pressed',orbitsOn);});
document.getElementById('bLab').addEventListener('click',function(e){labelsOn=!labelsOn;e.currentTarget.setAttribute('aria-pressed',labelsOn);document.body.classList.toggle('labels-off',!labelsOn);});
window.addEventListener('keydown',function(e){
  var i=focus?mains.indexOf(focus.parent||focus):-1;
  if(e.key==='Escape')focusOn(null);
  else if(e.key==='ArrowRight'){e.preventDefault();focusOn(mains[(i+1+mains.length)%mains.length]);}
  else if(e.key==='ArrowLeft'){e.preventDefault();focusOn(mains[(i<=0?mains.length:i)-1]);}
  else if(e.key==='+'||e.key==='='){cam.rT=clampR(cam.rT*0.8);}
  else if(e.key==='-'){cam.rT=clampR(cam.rT*1.25);}
});

// ---------- input ----------
var ptrs=new Map(),pinchD=0,tap=null;
function pdist(){var a=Array.from(ptrs.values());return Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);}
canvas.addEventListener('pointerdown',function(e){
  canvas.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1)tap={x:e.clientX,y:e.clientY,t:performance.now()};else{tap=null;pinchD=pdist();}
  cam.vT=cam.vP=0;cam.phiG=null;idle=0;hideHint();
});
canvas.addEventListener('pointermove',function(e){
  var p=ptrs.get(e.pointerId);if(!p)return;
  var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;idle=0;
  if(ptrs.size===1){
    cam.theta-=dx*0.0055;cam.phi=clamp(cam.phi-dy*0.0055,0.06,Math.PI-0.06);
    cam.vT=-dx*0.0055*50;cam.vP=-dy*0.0055*50;
    if(tap&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)>8)tap=null;
  }else if(ptrs.size===2){
    var nd=pdist();if(pinchD>0)cam.rT=clampR(cam.rT*pinchD/nd);pinchD=nd;
  }
});
function endPtr(e){
  var had=ptrs.delete(e.pointerId);if(!had)return;
  if(ptrs.size<2)pinchD=0;
  if(tap&&e.type==='pointerup'&&performance.now()-tap.t<500)pick(tap.x,tap.y);
  tap=null;
}
canvas.addEventListener('pointerup',endPtr);canvas.addEventListener('pointercancel',endPtr);
canvas.addEventListener('wheel',function(e){e.preventDefault();hideHint();idle=0;cam.rT=clampR(cam.rT*Math.exp(e.deltaY*0.0012));},{passive:false});

// ---------- picking, labels ----------
var tmp=new THREE.Vector3(),projCss=1;
function project(b){
  if(b.d.virtual){b.vis=false;return;}
  tmp.copy(b.wp).project(camera);
  b.vis=tmp.z<1&&tmp.z>-1;
  b.px=(tmp.x*0.5+0.5)*innerWidth;b.py=(-tmp.y*0.5+0.5)*innerHeight;
  var dist=camera.position.distanceTo(b.wp);b.dist=dist;b.pr=b.d.r*projCss/dist;
}
function moonRelevant(b){return !b.parent||(focus&&(focus===b.parent||focus===b||focus.parent===b.parent));}
function pick(x,y){
  var best=null,bs=1e9;
  bodies.forEach(function(b){
    if(!b.vis||!moonRelevant(b))return;
    var hr=Math.max(b.pr*(b.d.ring?1.6:1),20),d=Math.hypot(b.px-x,b.py-y);
    if(d<=hr&&d/hr<bs){bs=d/hr;best=b;}
  });
  if(best)focusOn(best);
}
function updateLabels(){
  if(!labelsOn)return;
  bodies.forEach(function(b){
    var el=b.label;if(!el)return;
    var show=b.vis&&moonRelevant(b)&&b.px>-40&&b.px<innerWidth+40&&b.py>-40&&b.py<innerHeight+40;
    if(b.parent&&b.dist>60)show=false;
    if(b.d.minor&&!b.parent&&!(focus===b)&&b.dist>170)show=false;
    if(!show){if(el._on){el.style.display='none';el._on=false;}return;}
    if(!el._on){el.style.display='block';el._on=true;}
    var off=Math.min(b.pr,220)+10;
    el.style.transform='translate('+(b.px).toFixed(1)+'px,'+(b.py-off).toFixed(1)+'px) translate(-50%,-100%)';
  });
}

// ---------- resize ----------
function resize(){
  var w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,2.5);
  renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);
  camera.aspect=w/h;camera.updateProjectionMatrix();
  U.uPR.value=dpr;U.uProj.value=renderer.domElement.height/(2*Math.tan(FOV*Math.PI/360));
  projCss=h/(2*Math.tan(FOV*Math.PI/360));
  if(!focus&&cam.r>=cam.rT*0.98)cam.rT=overviewR();
}
window.addEventListener('resize',resize);resize();
cam.r=Math.min(320,cam.rT*2.6);

// ---------- loop ----------
var last=performance.now(),earthPhase=0,ready=false;
function softW(w){var s=w<0?-1:1;return s*Math.log(1+Math.abs(w)*2)/2;}
var starsObj=scene.getObjectByName('stars');
function solveKepler(M,e){var E=M;for(var i=0;i<7;i++)E=E-(E-e*Math.sin(E)-M)/(1-e*Math.cos(E));return E;}
function frame(now){
  var dt=Math.min(0.05,(now-last)/1000);last=now;
  var spd=paused?0:speedDays();
  U.uTime.value+=dt;
  bodies.forEach(function(b){
    var d=b.d;if(d.virtual||d.probe)return;
    if(d.P){
      var we=softW(TAU*spd/d.P);b.ang+=we*dt;
      if(d.comet){
        var M=((b.ang%TAU)+TAU)%TAU,E=solveKepler(M,b.ee);
        b.holder.position.set(b.ea*(Math.cos(E)-b.ee),0,b.eb*Math.sin(E));
      }else b.holder.position.set(Math.cos(b.ang)*d.d,0,Math.sin(b.ang)*d.d);
      if(d.id==='earth')earthPhase+=we*dt;
    }
    var sr=(d.spin||0);if(b.parent)sr=0.15;
    b.spinG.rotation.y+=sr*dt*(spd>0?(0.25+0.75*Math.min(1,spd/10)):0);
  });
  U.uPhase.value=earthPhase;
  trojans.forEach(function(t){t.g.rotation.y=-(jupiter.ang+t.off);});
  world.updateMatrixWorld(true);
  bodies.forEach(function(b){if(b.d.virtual){b.wp.set(0,0,0);return;}b.holder.getWorldPosition(b.wp);});
  // comet tails point away from the Sun and fade with distance
  bodies.forEach(function(b){
    if(!b.tail)return;
    var p=b.wp,dist=Math.hypot(p.x,p.y,p.z)||1,act=Math.pow(clamp(1-(dist-5)/48,0,1),1.4);
    var ax=p.x/dist,ay=p.y/dist,az=p.z/dist;
    var cx=-az,cz=ax,cl=Math.hypot(cx,cz)||1;
    var u=b.tail.uniforms;
    u.uPos.value.copy(p);u.uAnti.value.set(ax,ay,az);u.uCurve.value.set(cx/cl,0,cz/cl);
    u.uLen.value=3+b.d.comet.tail*act;u.uAct.value=act;
    b.coma.uniforms.uAct.value=act;
  });

  idle+=dt;
  var tv=focus?focus.wp:ZERO,kf=1-Math.exp(-dt*(focus?7:4)),kr=1-Math.exp(-dt*4.5);
  cam.tx+=(tv.x-cam.tx)*kf;cam.ty+=(tv.y-cam.ty)*kf;cam.tz+=(tv.z-cam.tz)*kf;
  cam.r+=(cam.rT-cam.r)*kr;
  if(cam.phiG!==null){cam.phi+=(cam.phiG-cam.phi)*kr;if(Math.abs(cam.phiG-cam.phi)<0.002)cam.phiG=null;}
  if(!ptrs.size){
    cam.theta+=cam.vT*dt;cam.phi=clamp(cam.phi+cam.vP*dt,0.06,Math.PI-0.06);
    var dec=Math.exp(-dt*4);cam.vT*=dec;cam.vP*=dec;
    if(!focus&&!reduce&&idle>4){cam.theta+=0.03*dt;cam.phi+=(1.12-cam.phi)*0.003*dt;}
    if(cinematic){
      cam.theta += 0.15 * dt;
      cam.phi = 1.1 + Math.sin(now/2500) * 0.4;
      if (!focus) cam.rT = overviewR() * (0.75 + Math.sin(now/4000) * 0.15);
    }
  }
  var sp=Math.sin(cam.phi);
  camera.position.set(cam.tx+cam.r*sp*Math.sin(cam.theta),cam.ty+cam.r*Math.cos(cam.phi),cam.tz+cam.r*sp*Math.cos(cam.theta));
  camera.lookAt(cam.tx,cam.ty,cam.tz);
  var offT=focus&&cardEl.classList.contains('show')?innerHeight*(innerWidth<innerHeight?0.17:0.1):0;
  cam.viewOff+=(offT-cam.viewOff)*kr;
  if(Math.abs(cam.viewOff)>0.5)camera.setViewOffset(innerWidth,innerHeight,0,cam.viewOff,innerWidth,innerHeight);
  else if(camera.view&&camera.view.enabled)camera.clearViewOffset();
  camera.updateMatrixWorld(true);
  starsObj.position.copy(camera.position);

  bodies.forEach(function(b){
    if(!b.line)return;
    b.line.visible=orbitsOn&&(!b.parent||(focus&&(focus===b.parent||focus.parent===b.parent)));
  });
  bodies.forEach(project);
  updateLabels();
  renderer.render(scene,camera);
  if(!ready){ready=true;loadEl.classList.add('gone');}
  
  if (window._ss_isVisible === undefined) {
    window._ss_isVisible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        window._ss_isVisible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(document.body);
    }
  }
  
  if (window._ss_isVisible) {
    requestAnimationFrame(frame);
  } else {
    setTimeout(function() { requestAnimationFrame(frame); }, 250);
  }
}
requestAnimationFrame(frame);
}
requestAnimationFrame(function(){setTimeout(start,40);});
})();