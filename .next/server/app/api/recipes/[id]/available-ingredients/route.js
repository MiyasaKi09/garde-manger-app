"use strict";(()=>{var e={};e.id=933,e.ids=[933],e.modules={2934:e=>{e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},4300:e=>{e.exports=require("buffer")},3685:e=>{e.exports=require("http")},5687:e=>{e.exports=require("https")},5477:e=>{e.exports=require("punycode")},2781:e=>{e.exports=require("stream")},7310:e=>{e.exports=require("url")},9796:e=>{e.exports=require("zlib")},2016:(e,t,i)=>{i.r(t),i.d(t,{originalPathname:()=>g,patchFetch:()=>m,requestAsyncStorage:()=>l,routeModule:()=>u,serverHooks:()=>x,staticGenerationAsyncStorage:()=>_});var r={};i.r(r),i.d(r,{GET:()=>c});var n=i(9303),a=i(8716),o=i(670),d=i(344),s=i(1615),p=i(7070);async function c(e,{params:t}){try{let e=(0,d.createRouteHandlerClient)({cookies:s.cookies}),{data:{user:i},error:r}=await e.auth.getUser();if(r||!i)return p.NextResponse.json({error:"Non authentifi\xe9"},{status:401});let n=t.id,{data:a,error:o}=await e.from("recipe_ingredients").select(`
        id,
        recipe_id,
        canonical_food_id,
        archetype_id,
        quantity,
        unit,
        notes,
        canonical_foods(id, canonical_name),
        archetypes(id, name)
      `).eq("recipe_id",n).order("id");if(o)return console.error("Erreur r\xe9cup\xe9ration ingr\xe9dients:",o),p.NextResponse.json({error:"Erreur lors de la r\xe9cup\xe9ration des ingr\xe9dients"},{status:500});if(!a||0===a.length)return p.NextResponse.json({ingredients:[]});let c=await Promise.all(a.map(async t=>{let r=[];if(t.canonical_food_id){let{data:n}=await e.from("inventory_lots").select(`
              id,
              product_name,
              quantity,
              unit,
              expiration_date,
              opened_at,
              products(id, canonical_food_id)
            `).eq("user_id",i.id).gt("quantity",0).or(`canonical_food_id.eq.${t.canonical_food_id}`).order("expiration_date",{ascending:!0});n&&n.length>0&&(r=n)}if(0===r.length&&t.archetype_id){let{data:n}=await e.from("inventory_lots").select(`
              id,
              product_name,
              quantity,
              unit,
              expiration_date,
              opened_at,
              products(id, archetype_id)
            `).eq("user_id",i.id).gt("quantity",0).order("expiration_date",{ascending:!0});n&&n.length>0&&(r=n.filter(e=>e.products?.archetype_id===t.archetype_id))}if(0===r.length){let n=t.canonical_foods?.canonical_name||t.archetypes?.name||"";if(n){let{data:t}=await e.from("inventory_lots").select(`
                id,
                product_name,
                quantity,
                unit,
                expiration_date,
                opened_at
              `).eq("user_id",i.id).gt("quantity",0).ilike("product_name",`%${n}%`).order("expiration_date",{ascending:!0}).limit(5);t&&t.length>0&&(r=t)}}return{ingredient_id:t.id,name:t.canonical_foods?.canonical_name||t.archetypes?.name||"Ingr\xe9dient inconnu",quantity_needed:t.quantity,unit_needed:t.unit,notes:t.notes,canonical_food_id:t.canonical_food_id,archetype_id:t.archetype_id,available_lots:r.map(e=>({lot_id:e.id,product_name:e.product_name,quantity_available:e.quantity,unit:e.unit,expiration_date:e.expiration_date,opened_at:e.opened_at,days_until_expiry:e.expiration_date?Math.ceil((new Date(e.expiration_date)-new Date)/864e5):null})),has_enough:r.some(e=>e.quantity>=t.quantity)}}));return p.NextResponse.json({recipe_id:parseInt(n),ingredients:c})}catch(e){return console.error("Erreur API available-ingredients:",e),p.NextResponse.json({error:"Erreur serveur interne"},{status:500})}}let u=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/recipes/[id]/available-ingredients/route",pathname:"/api/recipes/[id]/available-ingredients",filename:"route",bundlePath:"app/api/recipes/[id]/available-ingredients/route"},resolvedPagePath:"/workspaces/garde-manger-app/app/api/recipes/[id]/available-ingredients/route.js",nextConfigOutput:"",userland:r}),{requestAsyncStorage:l,staticGenerationAsyncStorage:_,serverHooks:x}=u,g="/api/recipes/[id]/available-ingredients/route";function m(){return(0,o.patchFetch)({serverHooks:x,staticGenerationAsyncStorage:_})}}};var t=require("../../../../../webpack-runtime.js");t.C(e);var i=e=>t(t.s=e),r=t.X(0,[948,766,70,958],()=>i(2016));module.exports=r})();