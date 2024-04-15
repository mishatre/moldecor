function p(e){if(e===null||typeof e!="object")return e;if(e instanceof Date)return new Date(e.getTime());if(e instanceof Set){let n=new Set;return e.forEach(r=>n.add(p(r))),n}if(e instanceof Map){let n=new Map;return e.forEach((r,a)=>n.set(a,p(r))),n}if(e instanceof RegExp)return new RegExp(e.source,e.flags);let t=Array.isArray(e)?[]:{};return Object.entries(e).forEach(([n,r])=>t[n]=p(r)),t}import"reflect-metadata";var u="moleculer:decorators";function y(e,t=""){return typeof e=="string"&&e.startsWith(`${u}${t}:`)}function S(e,t=""){return y(e,t)?e:`${u}${t}:${e}`}function m(e,t=""){let n=Reflect.getMetadataKeys(e)||[],r=[];return n.forEach(a=>{y(a,t)&&r.push({key:a.replace(new RegExp(`^${u}${t}:`),""),metadata:o(e,a,t)})}),r}function o(e,t,n=""){return p(Reflect.getMetadata(S(t,n),e))}function c(e,t,n,r=""){Reflect.defineMetadata(S(t,r),n,e)}function A(e){return(t,n,r)=>{let a=r.value;if(!a||typeof a!="function")throw new TypeError("An action must be a function");let i=n.toString(),s=o(t,"actions","service")||{};return s[i]=Object.assign({},{handler:a,name:i,visibility:"public"},e),c(t,"actions",s,"service"),r}}function $(e){return(t,n,r)=>{let a=r.value;if(!a||typeof a!="function")throw new TypeError("An event handler must be a function");let i=n.toString(),s=o(t,"events","service")||{};return s[i]=Object.assign({},{handler:a,name:i},e),c(t,"events",s,"service"),r}}function d(e){if(!e)throw new ReferenceError("Lifecycle event name required");return(t,n,r)=>{let a=r.value;if(!a||typeof a!="function")throw new TypeError("An lifecycle event handler must be a function");return c(t,e,a,"service"),r}}var k=d("created"),I=d("started"),L=d("stopped");var v=(e,t,n)=>{let r=n.value;if(!r||typeof r!="function")throw new TypeError("A method must be a function");let a=t.toString(),i=o(e,"methods","service")||{};return i[a]={handler:r},c(e,"methods",i,"service"),n},N=v;import{Service as h}from"moleculer";function f(e){return typeof e=="function"&&h.isPrototypeOf(e)}function l(e){if(!f(e))throw TypeError("Class must extend Service");let t={};return m(e.prototype,"service").forEach(({key:r,metadata:a})=>t[r]=a),t}function x(e){if(!f(e))throw TypeError("Class must extend Service");return o(e.prototype,"schema","service")||l(e)}function g(e){if(!e.mixins)return;let t=n=>n.map(r=>{let a=f(r)?x(r):r;return a.mixins&&(a.mixins=t(a.mixins)),a});e.mixins=t(e.mixins)}function B(e={}){return t=>{if(!f(t))throw TypeError("Class must extend Service");let n=o(t.prototype,"schema","service");return n||(n={...{name:t.name,...e},...l(t)},g(n),c(t.prototype,"schema",n,"service")),class extends t{constructor(...r){super(...r),this.parseServiceSchema(n)}}}}function V(e){return(t,n,r)=>{let a=r.value;if(!a||typeof a!="function")throw new TypeError("An event handler must be a function");let i=n.toString(),s=o(t,"channels","service")||{};return s[i]=Object.assign({},{handler:a,name:i},e),c(t,"channels",s,"service"),r}}export{A as Action,V as Channel,k as Created,$ as Event,N as Method,B as Service,I as Started,L as Stopped,g as convertServiceMixins,d as createLifeCycleEvent,l as getServiceInnerSchema,x as getServiceSchema,f as isServiceClass};
//# sourceMappingURL=index.js.map
