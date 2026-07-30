import{g as r,r as o,j as e,f as l}from"./index-BykMVUBw.js";/**
 * @license lucide-react v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=[["path",{d:"M21.801 10A10 10 0 1 1 17 3.335",key:"yps3ct"}],["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}]],d=r("circle-check-big",m);/**
 * @license lucide-react v1.16.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],u=r("x",x);function g({message:a,type:s="success",onClose:t}){o.useEffect(()=>{const n=setTimeout(()=>{t&&t()},5e3);return()=>clearTimeout(n)},[t]);const c=s==="success"?"bg-green-50 border-green-300":"bg-red-50 border-red-300",i=s==="success"?e.jsx(d,{className:"text-green-500",size:20}):e.jsx(l,{className:"text-red-500",size:20});return e.jsxs("div",{className:`fixed left-3 right-3 top-3 z-[70] flex items-start gap-3 rounded-xl border p-3 shadow-lg sm:left-auto sm:right-4 sm:top-4 sm:w-full sm:max-w-md sm:p-4 ${c}`,role:s==="success"?"status":"alert","aria-live":s==="success"?"polite":"assertive",children:[e.jsx("span",{className:"mt-0.5 shrink-0","aria-hidden":"true",children:i}),e.jsx("span",{className:"min-w-0 flex-1 break-words text-sm text-gray-800 sm:text-base",children:a}),e.jsx("button",{type:"button",onClick:t,className:"-m-1 inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-black/5 hover:text-gray-700","aria-label":"Fermer la notification",children:e.jsx(u,{"aria-hidden":"true",size:18})})]})}export{d as C,g as T,u as X};
