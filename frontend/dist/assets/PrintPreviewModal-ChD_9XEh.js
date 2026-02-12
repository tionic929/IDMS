import{c as m,r as a,j as e,ac as O,A as y,P as N,y as n}from"./index-BWXcCXM4.js";import{P as q,I as d}from"./cardManagement-ZZAOMsc8.js";import{c as A}from"./students-DUGoJQ4c.js";import{D as E}from"./download-CUO0jKsa.js";import"./map-pin-yLUKQ_09.js";import"./index-DIEUD5r9.js";import"./designerUtils-iHGIWI-l.js";import"./refresh-cw-BzyHKw87.js";import"./circle-check-DId6IehY.js";const G=[["path",{d:"M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3",key:"1i73f7"}],["path",{d:"M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3",key:"saxlbk"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 14v2",key:"8jcxud"}],["path",{d:"M12 8v2",key:"1woqiv"}],["path",{d:"M12 2v2",key:"tus03m"}]],K=m("flip-horizontal",G);const Z=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],W=m("info",Z);const X=[["circle",{cx:"6",cy:"6",r:"3",key:"1lh9wr"}],["path",{d:"M8.12 8.12 12 12",key:"1alkpv"}],["path",{d:"M20 4 8.12 15.88",key:"xgtan2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["path",{d:"M14.8 14.8 20 20",key:"ptml3r"}]],U=m("scissors",X);const J=[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]],Q=m("x",J);const V=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"11",x2:"11",y1:"8",y2:"14",key:"1vmskp"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],Y=m("zoom-in",V);const ee=[["circle",{cx:"11",cy:"11",r:"8",key:"4ej97u"}],["line",{x1:"21",x2:"16.65",y1:"21",y2:"16.65",key:"13gj7c"}],["line",{x1:"8",x2:"14",y1:"11",y2:"11",key:"durymu"}]],se=m("zoom-out",ee),me=({data:t,layout:r,onClose:w})=>{const[x,v]=a.useState(1.2),[o,I]=a.useState(!1),[c,z]=a.useState(!1),[p,_]=a.useState(""),[u,R]=a.useState(""),[g,k]=a.useState(!0),[b,P]=a.useState(0),[h,M]=a.useState(0),[f,C]=a.useState(0),[j,S]=a.useState(0),T=[{label:"None",values:{top:0,bottom:0,left:0,right:0}},{label:"5px",values:{top:5,bottom:5,left:5,right:5}},{label:"10px",values:{top:10,bottom:10,left:10,right:10}},{label:"15px",values:{top:15,bottom:15,left:15,right:15}}],$=s=>{P(s.values.top),M(s.values.bottom),C(s.values.left),S(s.values.right)};a.useEffect(()=>{k(!0);const s=setTimeout(()=>{const i=document.querySelector("#front-print-stage canvas"),l=document.querySelector("#back-print-stage canvas");i&&_(i.toDataURL("image/png",1)),l&&R(l.toDataURL("image/png",1)),k(!1)},1e3);return()=>clearTimeout(s)},[t,r]);const B=()=>{if(!p||!u){n.error("Images not ready. Please wait...");return}const s=document.createElement("a");s.download=`${t.idNumber}_FRONT.png`,s.href=p,s.click(),setTimeout(()=>{const i=document.createElement("a");i.download=`${t.idNumber}_BACK.png`,i.href=u,i.click()},300),n.success("High-resolution images downloaded!")},D=async()=>{if(!p||!u){n.error("Images still processing...");return}if(window.require)try{await A(t.id);const{ipcRenderer:s}=window.require("electron");n.info("Sending to printer..."),s.send("print-card-images",{frontImage:p,backImage:u,width:y,height:N,margins:{top:b,bottom:h,left:f,right:j}}),s.once("print-reply",(i,l)=>{l.success?(n.success("Print job completed!"),setTimeout(w,1500)):n.error(`Print failed: ${l.failureReason}`)})}catch(s){console.error("Print error:",s),n.error("Printing failed. Try downloading instead.")}else window.print()},F=y+f+j,L=N+b+h;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
        @media print {
          @page { 
            margin: 0; 
            size: 2.125in 3.375in portrait;
          }
          body, html {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          body * { visibility: hidden; }
          #print-root, #print-root * { visibility: visible; }
          #print-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print-page {
            width: 2.125in !important;
            height: 3.375in !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            overflow: hidden;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .print-page:last-child {
            page-break-after: auto !important;
          }
        }

        .hidden-canvas {
          position: absolute;
          left: -9999px;
          top: -9999px;
          pointer-events: none;
        }

        .blueprint-grid {
          background-color: #0f172a;
          background-size: 30px 30px;
          background-image: 
            linear-gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px);
        }

        .cut-guides {
          position: relative;
        }

        .cut-guides::before {
          content: '';
          position: absolute;
          inset: -12px;
          border: 2px dashed #14b8a6;
          border-radius: 4px;
          pointer-events: none;
        }

        /* Custom scrollbar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1e293b;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #64748b;
        }
      `}),e.jsxs("div",{className:"fixed inset-0 z-[100] flex bg-slate-950 text-slate-200 overflow-hidden",children:[e.jsxs("aside",{className:"w-[30vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-slate-800 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold text-white",children:"Print Settings"}),e.jsx("p",{className:"text-xs text-slate-400 mt-0.5",children:t.idNumber})]}),e.jsx("button",{onClick:w,className:"p-2 hover:bg-slate-800 rounded-lg transition-colors",children:e.jsx(Q,{size:18,className:"text-slate-400"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-slate-400 uppercase tracking-wider",children:"Preview Zoom"}),e.jsxs("span",{className:"text-sm font-mono font-semibold text-teal-400",children:[Math.round(x*100),"%"]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{onClick:()=>v(Math.max(.3,x-.1)),className:"p-2 hover:bg-slate-800 rounded-lg transition-colors",children:e.jsx(se,{size:14,className:"text-slate-400"})}),e.jsx("input",{type:"range",min:"0.3",max:"1.5",step:"0.1",value:x,onChange:s=>v(parseFloat(s.target.value)),className:"flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsx("button",{onClick:()=>v(Math.min(1.5,x+.1)),className:"p-2 hover:bg-slate-800 rounded-lg transition-colors",children:e.jsx(Y,{size:14,className:"text-slate-400"})})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs font-semibold text-slate-400 uppercase tracking-wider",children:"Display Options"}),e.jsxs("span",{className:"flex flex-row gap-4",children:[e.jsxs("button",{onClick:()=>I(!o),className:`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${o?"border-teal-500 bg-teal-500/10":"border-slate-700 hover:border-slate-600"}`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(U,{size:16,className:o?"text-teal-400":"text-slate-400"}),e.jsx("span",{className:"text-sm font-medium",children:"Cut Guides"})]}),e.jsx("div",{className:`w-2 h-2 rounded-full ${o?"bg-teal-400":"bg-slate-600"}`})]}),e.jsxs("button",{onClick:()=>z(!c),className:`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${c?"border-teal-500 bg-teal-500/10":"border-slate-700 hover:border-slate-600"}`,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(K,{size:16,className:c?"text-teal-400":"text-slate-400"}),e.jsx("span",{className:"text-sm font-medium",children:"Mirror Back"})]}),e.jsx("div",{className:`w-2 h-2 rounded-full ${c?"bg-teal-400":"bg-slate-600"}`})]})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("span",{className:"flex flex-row justify-between items-center ",children:["Settings",e.jsx(O,{size:14,className:"text-slate-500"})]}),e.jsxs("div",{className:"p-1 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4",children:[e.jsx("div",{className:"grid grid-cols-2 gap-1",children:T.map(s=>e.jsx("button",{onClick:()=>$(s),className:"py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors",children:s.label},s.label))}),[{label:"Top",value:b,setter:P},{label:"Right",value:j,setter:S},{label:"Bottom",value:h,setter:M},{label:"Left",value:f,setter:C}].map(({label:s,value:i,setter:l})=>e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between text-xs mb-1.5",children:[e.jsx("span",{className:"font-medium text-slate-400",children:s}),e.jsxs("span",{className:"font-semibold text-teal-400",children:[i,"px"]})]}),e.jsx("input",{type:"range",min:"0",max:"50",value:i,onChange:H=>l(Number(H.target.value)),className:"w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"})]},s))]})]}),e.jsxs("div",{className:"p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20",children:[e.jsxs("div",{className:"flex items-center gap-2 text-indigo-400 mb-2",children:[e.jsx(W,{size:14}),e.jsx("span",{className:"text-xs font-semibold uppercase tracking-wider",children:"Output Specs"})]}),e.jsxs("div",{className:"space-y-1 text-xs text-slate-400",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Resolution:"}),e.jsxs("span",{className:"font-mono text-slate-300",children:[y,"×",N,"px"]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"DPI:"}),e.jsx("span",{className:"font-mono text-slate-300",children:"300"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Format:"}),e.jsx("span",{className:"font-mono text-slate-300",children:"CR80"})]}),b+h+f+j>0&&e.jsxs("div",{className:"flex justify-between pt-2 border-t border-indigo-500/20",children:[e.jsx("span",{children:"With Margins:"}),e.jsxs("span",{className:"font-mono text-slate-300",children:[F,"×",L,"px"]})]})]})]})]}),e.jsxs("div",{className:"p-6 bg-slate-950 border-t border-slate-800 space-y-3",children:[e.jsxs("button",{onClick:B,disabled:g,className:"w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",children:[e.jsx(E,{size:16}),g?"Processing...":"Download Images"]}),e.jsxs("button",{onClick:D,disabled:g,className:"w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20",children:[e.jsx(q,{size:16}),g?"Processing...":"Print Cards"]})]})]}),e.jsx("main",{className:"flex-1 blueprint-grid relative flex items-center justify-center overflow-auto p-12 custom-scrollbar",children:e.jsxs("div",{className:"flex flex-col xl:flex-row gap-12 transition-transform duration-300 ease-out",style:{transform:`scale(${x})`},children:[e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:`shadow-2xl rounded-sm overflow-hidden ${o?"cut-guides":""}`,children:e.jsx(d,{data:t,layout:r,side:"FRONT",scale:1,isPrinting:!1})}),e.jsx("div",{className:"px-4 py-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700",children:e.jsx("span",{className:"text-xs font-semibold text-slate-300 uppercase tracking-wider",children:"Front Side"})})]}),e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:`shadow-2xl rounded-sm overflow-hidden ${o?"cut-guides":""}`,style:{transform:c?"scaleX(-1)":"none"},children:e.jsx(d,{data:t,layout:r,side:"BACK",scale:1,isPrinting:!1})}),e.jsx("div",{className:"px-4 py-1.5 rounded-full bg-slate-800/80 backdrop-blur-sm border border-slate-700",children:e.jsx("span",{className:"text-xs font-semibold text-slate-300 uppercase tracking-wider",children:"Back Side"})})]})]})})]}),e.jsxs("div",{className:"hidden-canvas",children:[e.jsx("div",{id:"front-print-stage",children:e.jsx(d,{data:t,layout:r,side:"FRONT",scale:1,isPrinting:!0})}),e.jsx("div",{id:"back-print-stage",children:e.jsx(d,{data:t,layout:r,side:"BACK",scale:1,isPrinting:!0})})]}),e.jsxs("div",{id:"print-root",className:"print-only",children:[e.jsx("div",{className:"print-page",children:e.jsx(d,{data:t,layout:r,side:"FRONT",scale:1,isPrinting:!0})}),e.jsx("div",{className:"print-page",style:{transform:c?"scaleX(-1)":"none"},children:e.jsx(d,{data:t,layout:r,side:"BACK",scale:1,isPrinting:!0})})]})]})};export{me as default};
