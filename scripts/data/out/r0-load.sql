-- Chargement R0 (recettes candidates). Généré par build-r0.mjs. Idempotent.
insert into ops.source_datasets (code,name,publisher,source_url,license_code,allowed_uses,update_strategy,current_version,last_checked_at)
values ('myko_editorial','Recettes éditoriales Myko','Myko','internal','cc0-1.0',
        '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
        'manual','r0',now())
on conflict (code) do update set last_checked_at=now();

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_poulet uuid; v_comp_sauce_moutarde uuid; v_comp_puree uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Poulet à la moutarde et purée','poulet a la moutarde et puree','diner','proteine + feculent + sauce','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Poulet à la moutarde, purée maison',sd.id,'r0:poulet a la moutarde et puree',4,20,35,'facile','C','draft',md5('r0:poulet a la moutarde et puree:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:poulet a la moutarde et puree:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'poulet','protein',1) RETURNING id INTO v_comp_poulet;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'sauce moutarde','sauce',2) RETURNING id INTO v_comp_sauce_moutarde;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'purée','side',3) RETURNING id INTO v_comp_puree;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_poulet,'validated_options',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'haut de cuisse de poulet'
       or position('haut de cuisse de poulet' in fc.canonical_name_normalized) > 0
       or (length('haut de cuisse de poulet') >= 5 and position(fc.canonical_name_normalized in 'haut de cuisse de poulet') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),600,'g','preferred','piece a mijoter',false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'moutarde'
       or position('moutarde' in fc.canonical_name_normalized) > 0
       or (length('moutarde') >= 5 and position(fc.canonical_name_normalized in 'moutarde') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),30,'g','required',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'functional_requirement',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'creme'
       or position('creme' in fc.canonical_name_normalized) > 0
       or (length('creme') >= 5 and position(fc.canonical_name_normalized in 'creme') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),150,'ml','recommended',NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'oignon jaune'
       or position('oignon jaune' in fc.canonical_name_normalized) > 0
       or (length('oignon jaune') >= 5 and position(fc.canonical_name_normalized in 'oignon jaune') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),1,'u','recommended',NULL,false,4);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_puree,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'pomme de terre'
       or position('pomme de terre' in fc.canonical_name_normalized) > 0
       or (length('pomme de terre') >= 5 and position(fc.canonical_name_normalized in 'pomme de terre') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),800,'g','required',NULL,false,5);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',NULL,0,'g','optional',NULL,true,6);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Émincer l''oignon. Saler les hauts de cuisse.',5,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Saisir les hauts de cuisse 4 min par face dans une cocotte, réserver.',10,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,3,'Faire suer l''oignon, déglacer, ajouter moutarde et crème.',5,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,4,'Remettre le poulet, couvrir, mijoter 20 min à feu doux.',2,20,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,5,'Cuire les pommes de terre épluchées 20 min à l''eau, écraser en purée.',8,20,NULL);
  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required)
      VALUES(v_fam,'morceau','single',true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,confidence_level,status)
      SELECT ax.id, x.name, 'C','candidate' FROM ax, (VALUES ('haut de cuisse de poulet'),('cuisse de poulet'),('blanc de poulet')) AS x(name);
  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required)
      VALUES(v_fam,'féculent','single',true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,confidence_level,status)
      SELECT ax.id, x.name, 'C','candidate' FROM ax, (VALUES ('pomme de terre'),('pomme de terre et céleri-rave')) AS x(name);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Lentilles vertes mijotées','lentilles vertes mijotees','diner','legumineuse','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Lentilles vertes aux carottes et oignon',sd.id,'r0:lentilles vertes mijotees',4,10,30,'facile','C','draft',md5('r0:lentilles vertes mijotees:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:lentilles vertes mijotees:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'lentille verte'
       or position('lentille verte' in fc.canonical_name_normalized) > 0
       or (length('lentille verte') >= 5 and position(fc.canonical_name_normalized in 'lentille verte') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),250,'g','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'carotte'
       or position('carotte' in fc.canonical_name_normalized) > 0
       or (length('carotte') >= 5 and position(fc.canonical_name_normalized in 'carotte') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),2,'u','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'oignon jaune'
       or position('oignon jaune' in fc.canonical_name_normalized) > 0
       or (length('oignon jaune') >= 5 and position(fc.canonical_name_normalized in 'oignon jaune') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),1,'u','recommended',NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Émincer oignon et carottes en dés.',5,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Faire suer, ajouter les lentilles rincées et 2× leur volume d''eau.',3,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,3,'Mijoter 25-30 min jusqu''à absorption, saler en fin de cuisson.',2,28,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_omelette uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Omelette aux fines herbes','omelette aux fines herbes','diner','oeufs','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Omelette aux fines herbes',sd.id,'r0:omelette aux fines herbes',2,5,5,'facile','C','draft',md5('r0:omelette aux fines herbes:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:omelette aux fines herbes:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'omelette','main',1) RETURNING id INTO v_comp_omelette;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'oeuf'
       or position('oeuf' in fc.canonical_name_normalized) > 0
       or (length('oeuf') >= 5 and position(fc.canonical_name_normalized in 'oeuf') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),4,'u','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'persil'
       or position('persil' in fc.canonical_name_normalized) > 0
       or (length('persil') >= 5 and position(fc.canonical_name_normalized in 'persil') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),10,'g','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Battre les œufs, ciseler le persil, saler.',3,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Cuire à feu moyen 3-4 min, plier.',4,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_gratin uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Gratin de pommes de terre','gratin de pommes de terre','diner','feculent gratine','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Gratin de pommes de terre',sd.id,'r0:gratin de pommes de terre',4,15,45,'facile','C','draft',md5('r0:gratin de pommes de terre:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:gratin de pommes de terre:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'gratin','main',1) RETURNING id INTO v_comp_gratin;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'pomme de terre'
       or position('pomme de terre' in fc.canonical_name_normalized) > 0
       or (length('pomme de terre') >= 5 and position(fc.canonical_name_normalized in 'pomme de terre') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),800,'g','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'functional_requirement',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'creme'
       or position('creme' in fc.canonical_name_normalized) > 0
       or (length('creme') >= 5 and position(fc.canonical_name_normalized in 'creme') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),200,'ml','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'validated_options',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'comte'
       or position('comte' in fc.canonical_name_normalized) > 0
       or (length('comte') >= 5 and position(fc.canonical_name_normalized in 'comte') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),80,'g','recommended',NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Éplucher et émincer finement les pommes de terre.',10,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Disposer en couches, napper de crème, râper le fromage.',5,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,3,'Cuire 45 min à 180 °C.',NULL,45,180);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Poêlée de haricots verts à l''ail','poelee de haricots verts a l ail','diner','legume','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Haricots verts poêlés à l''ail',sd.id,'r0:poelee de haricots verts a l ail',4,5,15,'facile','C','draft',md5('r0:poelee de haricots verts a l ail:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:poelee de haricots verts a l ail:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'haricot vert'
       or position('haricot vert' in fc.canonical_name_normalized) > 0
       or (length('haricot vert') >= 5 and position(fc.canonical_name_normalized in 'haricot vert') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),500,'g','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'ail'
       or position('ail' in fc.canonical_name_normalized) > 0
       or (length('ail') >= 5 and position(fc.canonical_name_normalized in 'ail') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),2,'u','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Cuire les haricots 8 min à l''eau bouillante salée.',NULL,8,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Poêler avec l''ail écrasé 5 min.',5,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_salade uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Salade de pois chiches','salade de pois chiches','dejeuner','legumineuse froide','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Salade de pois chiches',sd.id,'r0:salade de pois chiches',4,10,0,'facile','C','draft',md5('r0:salade de pois chiches:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:salade de pois chiches:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'salade','main',1) RETURNING id INTO v_comp_salade;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'pois chiche'
       or position('pois chiche' in fc.canonical_name_normalized) > 0
       or (length('pois chiche') >= 5 and position(fc.canonical_name_normalized in 'pois chiche') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),400,'g','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'tomate'
       or position('tomate' in fc.canonical_name_normalized) > 0
       or (length('tomate') >= 5 and position(fc.canonical_name_normalized in 'tomate') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),2,'u','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'oignon rouge'
       or position('oignon rouge' in fc.canonical_name_normalized) > 0
       or (length('oignon rouge') >= 5 and position(fc.canonical_name_normalized in 'oignon rouge') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),1,'u','recommended',NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Rincer les pois chiches, couper tomates et oignon.',8,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Mélanger, assaisonner d''huile et de vinaigre.',2,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Quinoa aux légumes','quinoa aux legumes','diner','cereale + legumes','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Quinoa poêlé aux légumes',sd.id,'r0:quinoa aux legumes',4,10,20,'facile','C','draft',md5('r0:quinoa aux legumes:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:quinoa aux legumes:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'quinoa'
       or position('quinoa' in fc.canonical_name_normalized) > 0
       or (length('quinoa') >= 5 and position(fc.canonical_name_normalized in 'quinoa') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),200,'g','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'carotte'
       or position('carotte' in fc.canonical_name_normalized) > 0
       or (length('carotte') >= 5 and position(fc.canonical_name_normalized in 'carotte') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),2,'u','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'poivron rouge'
       or position('poivron rouge' in fc.canonical_name_normalized) > 0
       or (length('poivron rouge') >= 5 and position(fc.canonical_name_normalized in 'poivron rouge') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),1,'u','recommended',NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Cuire le quinoa 15 min dans 2× son volume d''eau.',NULL,15,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Poêler les légumes en dés, mélanger au quinoa.',8,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_poisson uuid; v_comp_riz uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Cabillaud au four et riz','cabillaud au four et riz','diner','poisson + feculent','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Cabillaud au four, riz blanc',sd.id,'r0:cabillaud au four et riz',4,10,25,'facile','C','draft',md5('r0:cabillaud au four et riz:v1')
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (content_hash) DO NOTHING;
  SELECT id INTO v_ver FROM culinary.recipe_versions WHERE content_hash=md5('r0:cabillaud au four et riz:v1');
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'poisson','protein',1) RETURNING id INTO v_comp_poisson;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position)
      VALUES(v_ver,'riz','side',2) RETURNING id INTO v_comp_riz;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'cabillaud'
       or position('cabillaud' in fc.canonical_name_normalized) > 0
       or (length('cabillaud') >= 5 and position(fc.canonical_name_normalized in 'cabillaud') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),600,'g','required',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'citron'
       or position('citron' in fc.canonical_name_normalized) > 0
       or (length('citron') >= 5 and position(fc.canonical_name_normalized in 'citron') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),1,'u','recommended',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,is_optional,position)
      VALUES(v_ver,v_comp_riz,'validated_options',(select ff.id from catalog.food_forms ff join catalog.food_concepts fc on fc.id=ff.food_concept_id
     where fc.status <> 'rejected' and (
       fc.canonical_name_normalized = 'riz blanc'
       or position('riz blanc' in fc.canonical_name_normalized) > 0
       or (length('riz blanc') >= 5 and position(fc.canonical_name_normalized in 'riz blanc') > 0)
     ) order by length(ff.canonical_name_normalized) asc limit 1),250,'g','required',NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,1,'Déposer le cabillaud avec des rondelles de citron, saler.',5,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,2,'Cuire 20 min à 180 °C.',NULL,20,180);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c)
      VALUES(v_ver,3,'Cuire le riz 12 min à l''eau bouillante salée.',NULL,12,NULL);
END $$;

-- Liste fonctionnelle F0 dérivée de R0 : 21 aliments distincts.
