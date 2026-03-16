const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/PaymentProofModal-DDE0lN2q.js","assets/index-C1RkkQy7.js","assets/index-BQH6M9Xz.css"])))=>i.map(i=>d[i]);
import{c as y,r as a,j as e,X as G,Z as K,a as V,S as W,P as N,b as w,D as X,M as Y,d as J,R as Q,I as d,L as ee,y as n,e as _,_ as se}from"./index-C1RkkQy7.js";const te=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],ae=y("info",te);const ie=[["circle",{cx:"6",cy:"6",r:"3",key:"1lh9wr"}],["path",{d:"M8.12 8.12 12 12",key:"1alkpv"}],["path",{d:"M20 4 8.12 15.88",key:"xgtan2"}],["circle",{cx:"6",cy:"18",r:"3",key:"fqmcym"}],["path",{d:"M14.8 14.8 20 20",key:"ptml3r"}]],re=y("scissors",ie);const ne=[["path",{d:"M8 3H5a2 2 0 0 0-2 2v14c0 1.1.9 2 2 2h3",key:"1i73f7"}],["path",{d:"M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3",key:"saxlbk"}],["path",{d:"M12 20v2",key:"1lh1kg"}],["path",{d:"M12 14v2",key:"8jcxud"}],["path",{d:"M12 8v2",key:"1woqiv"}],["path",{d:"M12 2v2",key:"tus03m"}]],le=y("square-centerline-dashed-horizontal",ne),oe=a.lazy(()=>se(()=>import("./PaymentProofModal-DDE0lN2q.js"),__vite__mapDeps([0,1,2]))),me=({data:s,layout:l,onClose:k})=>{const[m,v]=a.useState(1.2),[o,T]=a.useState(!1),[c,E]=a.useState(!1),[u,L]=a.useState(""),[b,B]=a.useState(""),[x,P]=a.useState(!0),[I,C]=a.useState(null),[g,S]=a.useState(0),[h,M]=a.useState(0),[f,R]=a.useState(0),[j,$]=a.useState(0),q=[{label:"None",values:{top:0,bottom:0,left:0,right:0}},{label:"5px",values:{top:5,bottom:5,left:5,right:5}},{label:"10px",values:{top:10,bottom:10,left:10,right:10}},{label:"15px",values:{top:15,bottom:15,left:15,right:15}}],F=t=>{S(t.values.top),M(t.values.bottom),R(t.values.left),$(t.values.right)};a.useEffect(()=>{P(!0);const t=setTimeout(()=>{const i=document.querySelector("#front-print-stage canvas"),p=document.querySelector("#back-print-stage canvas");i&&L(i.toDataURL("image/png",1)),p&&B(p.toDataURL("image/png",1)),P(!1)},1e3);return()=>clearTimeout(t)},[s,l]);const O=()=>{if(!u||!b){n.error("Images not ready. Please wait...");return}const t=document.createElement("a");t.download=`${s.idNumber} _FRONT.png`,t.href=u,t.click(),setTimeout(()=>{const i=document.createElement("a");i.download=`${s.idNumber} _BACK.png`,i.href=b,i.click()},300),n.success("High-resolution images downloaded!")},A=async()=>{if(!u||!b){n.error("Images still processing...");return}const i=(()=>{const r=window;return!!(r.process&&r.process.type)||!!(r.navigator&&r.navigator.userAgent.includes("Electron"))})();if(typeof window.require<"u"||i)try{await _(s.id);const z=window.require("electron").ipcRenderer;n.info("Sending to local printer service..."),z.send("print-card-images",{frontImage:u,backImage:b,width:N,height:w,margins:{top:g,bottom:h,left:f,right:j}}),z.once("print-reply",(ce,D)=>{D.success?(n.success("Print job completed successfully!"),setTimeout(k,1500)):n.error(`Print failed: ${D.failureReason}`)})}catch(r){console.error("Print error:",r),n.error("Local printing failed. The Python service might be busy.")}else if(window.confirm("Mark as ISSUED and open print dialog?"))try{await _(s.id),n.warn("Silent printing requires the Desktop App. Opening browser print..."),window.print()}catch{n.error("Failed to confirm issuance.")}},H=()=>{const t=encodeURIComponent(`Student ID Card - ${s.lastName}, ${s.firstName}`),i=encodeURIComponent(`Hello ${s.firstName},

Your ID card for ID ${s.idNumber} has been processed and is ready for pickup.

You can also find your digital copy attached (if available).

Details:
Name: ${s.firstName} ${s.lastName}
Course: ${s.course}
ID: ${s.idNumber}`);window.location.href=`mailto:${s.email||""}?subject=${t}&body=${i}`,n.info("Opening email client...")},U=N+f+j,Z=w+g+h;return e.jsxs(e.Fragment,{children:[e.jsx("style",{children:`
@media print {
  @page {
    margin: 0;
  }
  body, html {
    margin: 0!important;
    padding: 0!important;
  }
  body * { visibility: hidden; }
  #print - root, #print - root * { visibility: visible; }
  #print - root {
    position: absolute;
    left: 0;
    top: 0;
    width: 100 %;
  }
          .print - page {
    width: 2.125in !important;
    height: 3.375in !important;
    page -break-after: always!important;
    page -break-inside: avoid!important;
    overflow: hidden;
    display: flex;
    align - items: center;
    justify - content: center;
  }
          .print - page: last - child {
    page -break-after: auto!important;
  }
}

        .hidden - canvas {
  position: absolute;
  left: -9999px;
  top: -9999px;
  pointer - events: none;
}

        .blueprint - grid {
  background - color: #0f172a;
  background - size: 30px 30px;
  background - image:
  linear - gradient(to right, rgba(100, 116, 139, 0.1) 1px, transparent 1px),
    linear - gradient(to bottom, rgba(100, 116, 139, 0.1) 1px, transparent 1px);
}

        .cut - guides {
  position: relative;
}

        .cut - guides::before {
  content: '';
  position: absolute;
  inset: -12px;
  border: 2px dashed #14b8a6;
  border - radius: 4px;
  pointer - events: none;
}

        .custom - scrollbar:: -webkit - scrollbar {
  width: 6px;
  height: 6px;
}

        .custom - scrollbar:: -webkit - scrollbar - track {
  background: #1e293b;
}

        .custom - scrollbar:: -webkit - scrollbar - thumb {
  background: #475569;
  border - radius: 3px;
}

        .custom - scrollbar:: -webkit - scrollbar - thumb:hover {
  background: #64748b;
}
`}),e.jsxs("div",{className:"fixed inset-0 z-[100] flex bg-slate-950 text-slate-200 overflow-hidden",children:[e.jsxs("aside",{className:"w-[30vw] h-full bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 shadow-2xl",children:[e.jsxs("div",{className:"p-6 border-b border-slate-800 flex items-center justify-between",children:[e.jsxs("div",{children:[e.jsx("h2",{className:"text-lg font-semibold text-white",children:"Print Settings"}),e.jsx("p",{className:"text-xs text-slate-400 mt-0.5",children:s.idNumber})]}),e.jsx("button",{onClick:k,className:"p-2 hover:bg-slate-800 rounded-lg transition-colors",children:e.jsx(G,{size:18,className:"text-slate-400"})})]}),e.jsxs("div",{className:"flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar",children:[e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center justify-between",children:[e.jsx("span",{className:"text-xs font-semibold text-slate-400 uppercase tracking-wider",children:"Preview Zoom"}),e.jsxs("span",{className:"text-sm font-mono font-semibold text-teal-400",children:[Math.round(m*100),"%"]})]}),e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("button",{onClick:()=>v(Math.max(.3,m-.1)),className:"p-2 hover:bg-slate-800 rounded-lg transition-colors",children:e.jsx(K,{size:14,className:"text-slate-400"})}),e.jsx("input",{type:"range",min:"0.3",max:"1.5",step:"0.1",value:m,onChange:t=>v(parseFloat(t.target.value)),className:"flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"}),e.jsx("button",{onClick:()=>v(Math.min(1.5,m+.1)),className:"p-2 hover:bg-slate-800 rounded-lg transition-colors",children:e.jsx(V,{size:14,className:"text-slate-400"})})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsx("p",{className:"text-xs font-semibold text-slate-400 uppercase tracking-wider",children:"Display Options"}),e.jsxs("div",{className:"flex flex-row gap-4",children:[e.jsxs("button",{onClick:()=>T(!o),className:`w - full flex items - center justify - between p - 3 rounded - lg border - 2 transition - all ${o?"border-teal-500 bg-teal-500/10":"border-slate-700 hover:border-slate-600"} `,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(re,{size:16,className:o?"text-teal-400":"text-slate-400"}),e.jsx("span",{className:"text-sm font-medium",children:"Cut Guides"})]}),e.jsx("div",{className:`w - 2 h - 2 rounded - full ${o?"bg-teal-400":"bg-slate-600"} `})]}),e.jsxs("button",{onClick:()=>E(!c),className:`w - full flex items - center justify - between p - 3 rounded - lg border - 2 transition - all ${c?"border-teal-500 bg-teal-500/10":"border-slate-700 hover:border-slate-600"} `,children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(le,{size:16,className:c?"text-teal-400":"text-slate-400"}),e.jsx("span",{className:"text-sm font-medium",children:"Mirror Back"})]}),e.jsx("div",{className:`w - 2 h - 2 rounded - full ${c?"bg-teal-400":"bg-slate-600"} `})]})]})]}),e.jsxs("div",{className:"space-y-3",children:[e.jsxs("span",{className:"flex flex-row justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider",children:["Margin Settings",e.jsx(W,{size:14,className:"text-slate-500"})]}),e.jsxs("div",{className:"p-3 bg-slate-950/50 rounded-lg border border-slate-800 space-y-4",children:[e.jsx("div",{className:"grid grid-cols-2 gap-2",children:q.map(t=>e.jsx("button",{onClick:()=>F(t),className:"py-2 px-3 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors",children:t.label},t.label))}),[{label:"Top",value:g,setter:S},{label:"Right",value:j,setter:$},{label:"Bottom",value:h,setter:M},{label:"Left",value:f,setter:R}].map(({label:t,value:i,setter:p})=>e.jsxs("div",{children:[e.jsxs("div",{className:"flex justify-between text-xs mb-1.5",children:[e.jsx("span",{className:"font-medium text-slate-400",children:t}),e.jsxs("span",{className:"font-semibold text-teal-400",children:[i,"px"]})]}),e.jsx("input",{type:"range",min:"0",max:"50",value:i,onChange:r=>p(Number(r.target.value)),className:"w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-500"})]},t))]})]}),e.jsxs("div",{className:"p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20",children:[e.jsxs("div",{className:"flex items-center gap-2 text-indigo-400 mb-2",children:[e.jsx(ae,{size:14}),e.jsx("span",{className:"text-xs font-semibold uppercase tracking-wider",children:"Output Specs"})]}),e.jsxs("div",{className:"space-y-1 text-xs text-slate-400",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Resolution:"}),e.jsxs("span",{className:"font-mono text-slate-300",children:[N,"×",w,"px"]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"DPI:"}),e.jsx("span",{className:"font-mono text-slate-300",children:"300"})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Format:"}),e.jsx("span",{className:"font-mono text-slate-300",children:"CR80"})]}),g+h+f+j>0&&e.jsxs("div",{className:"flex justify-between pt-2 border-t border-indigo-500/20",children:[e.jsx("span",{children:"With Margins:"}),e.jsxs("span",{className:"font-mono text-slate-300",children:[U,"×",Z,"px"]})]})]})]})]}),e.jsxs("div",{className:"p-6 bg-slate-950 border-t border-slate-800 space-y-3",children:[e.jsxs("button",{onClick:O,disabled:x,className:"w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",children:[e.jsx(X,{size:16}),x?"Processing...":"Download Images"]}),e.jsxs("button",{onClick:H,disabled:x,className:"w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2",children:[e.jsx(Y,{size:16}),"Email Notification"]}),e.jsxs("button",{onClick:A,disabled:x,className:"w-full py-3 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20",children:[e.jsx(J,{size:16}),x?"Processing...":"Print Cards"]}),s.paymentProof&&e.jsxs("button",{onClick:()=>C(s.paymentProof||null),className:"w-full mt-2 py-3 px-4 bg-slate-800 hover:bg-slate-700 text-teal-400 border border-teal-500/30 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg",children:[e.jsx(Q,{size:16}),"View Payment Proof"]})]})]}),e.jsx("main",{className:"flex-1 blueprint-grid relative flex items-center justify-center overflow-auto p-12 custom-scrollbar",children:e.jsxs("div",{className:"flex flex-col xl:flex-row gap-12 transition-transform duration-300 ease-out",style:{transform:`scale(${m})`},children:[e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:`shadow - 2xl rounded - sm overflow - hidden ${o?"cut-guides":""} `,children:e.jsx(d,{data:s,layout:l,side:"FRONT",scale:1,isPrinting:!1})}),e.jsx("div",{className:"px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700",children:e.jsx("span",{className:"text-xs font-semibold text-slate-300 uppercase tracking-wider",children:"Front Side"})})]}),e.jsxs("div",{className:"flex flex-col items-center gap-4",children:[e.jsx("div",{className:`shadow - 2xl rounded - sm overflow - hidden ${o?"cut-guides":""} `,style:{transform:c?"scaleX(-1)":"none"},children:e.jsx(d,{data:s,layout:l,side:"BACK",scale:1,isPrinting:!1})}),e.jsx("div",{className:"px-4 py-1.5 rounded-full bg-slate-800 border border-slate-700",children:e.jsx("span",{className:"text-xs font-semibold text-slate-300 uppercase tracking-wider",children:"Back Side"})})]})]})})]}),e.jsxs("div",{className:"hidden-canvas",children:[e.jsx("div",{id:"front-print-stage",children:e.jsx(d,{data:s,layout:l,side:"FRONT",scale:1,isPrinting:!0})}),e.jsx("div",{id:"back-print-stage",children:e.jsx(d,{data:s,layout:l,side:"BACK",scale:1,isPrinting:!0})})]}),e.jsxs("div",{id:"print-root",className:"print-only",children:[e.jsx("div",{className:"print-page",children:e.jsx(d,{data:s,layout:l,side:"FRONT",scale:1,isPrinting:!0})}),e.jsx("div",{className:"print-page",style:{transform:c?"scaleX(-1)":"none"},children:e.jsx(d,{data:s,layout:l,side:"BACK",scale:1,isPrinting:!0})})]}),I&&e.jsx(a.Suspense,{fallback:e.jsx("div",{className:"fixed inset-0 bg-black/40 z-[110] flex items-center justify-center",children:e.jsx(ee,{className:"animate-spin text-white",size:48})}),children:e.jsx(oe,{url:I,onClose:()=>C(null)})})]})};export{me as default};
