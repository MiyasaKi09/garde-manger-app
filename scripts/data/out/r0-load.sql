-- Chargement R0 (recettes candidates). Généré par build-r0.mjs. IDEMPOTENT.
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
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Poulet à la moutarde, purée maison',sd.id,'r0:poulet a la moutarde et puree','Myko','cc0-1.0',4,20,35,'facile','C','draft','513d5093ca00c9b3326cdbcf0b204789'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'poulet','protein',1) RETURNING id INTO v_comp_poulet;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'sauce moutarde','sauce',2) RETURNING id INTO v_comp_sauce_moutarde;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'purée','side',3) RETURNING id INTO v_comp_puree;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poulet,'validated_options',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'haut de cuisse de poulet'
     order by ff.canonical_name_normalized limit 1),600,'g','preferred','piece a mijoter',NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'moutarde'
     order by ff.canonical_name_normalized limit 1),30,'g','required',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'creme'
     order by ff.canonical_name_normalized limit 1),150,'ml','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oignon jaune'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,4);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_puree,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'pomme de terre'
     order by ff.canonical_name_normalized limit 1),800,'g','required',NULL,NULL,false,5);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',NULL,0,'g','optional',NULL,NULL,true,6);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Émincer l''oignon. Saler les hauts de cuisse.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Saisir les hauts de cuisse 4 min par face dans une cocotte, réserver.',10,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,3,'Faire suer l''oignon, déglacer, ajouter moutarde et crème.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,4,'Remettre le poulet, couvrir, mijoter 20 min à feu doux.',2,20,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,5,'Cuire les pommes de terre épluchées 20 min à l''eau, écraser en purée.',8,20,NULL,NULL);
  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required) VALUES(v_fam,'morceau','single',true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,component_recipe_version_id,confidence_level,status)
      SELECT ax.id, x.name, NULL, 'C','candidate' FROM ax, (VALUES ('haut de cuisse de poulet'),('cuisse de poulet'),('blanc de poulet')) AS x(name);
  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required) VALUES(v_fam,'féculent','single',true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,component_recipe_version_id,confidence_level,status)
      SELECT ax.id, x.name, NULL, 'C','candidate' FROM ax, (VALUES ('pomme de terre'),('pomme de terre et céleri-rave')) AS x(name);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Lentilles vertes mijotées','lentilles vertes mijotees','diner','legumineuse','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Lentilles vertes aux carottes et oignon',sd.id,'r0:lentilles vertes mijotees','Myko','cc0-1.0',4,10,30,'facile','C','draft','84329a0daaa0167feb161f394899f645'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'lentille verte'
     order by ff.canonical_name_normalized limit 1),250,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'carotte'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oignon jaune'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Émincer oignon et carottes en dés.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Faire suer, ajouter les lentilles rincées et 2× leur volume d''eau.',3,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,3,'Mijoter 25-30 min jusqu''à absorption, saler en fin de cuisson.',2,28,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_omelette uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Omelette aux fines herbes','omelette aux fines herbes','diner','oeufs','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Omelette aux fines herbes',sd.id,'r0:omelette aux fines herbes','Myko','cc0-1.0',2,5,5,'facile','C','draft','a3d5bc0496606c7fa13b0b66252ca86b'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'omelette','main',1) RETURNING id INTO v_comp_omelette;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oeuf'
     order by ff.canonical_name_normalized limit 1),4,'u','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'persil'
     order by ff.canonical_name_normalized limit 1),10,'g','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Battre les œufs, ciseler le persil, saler.',3,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Cuire à feu moyen 3-4 min, plier.',4,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_gratin uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Gratin de pommes de terre','gratin de pommes de terre','diner','feculent gratine','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Gratin de pommes de terre',sd.id,'r0:gratin de pommes de terre','Myko','cc0-1.0',4,15,45,'facile','C','draft','3423d86e522f94a0683b15ed0f749ae0'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'gratin','main',1) RETURNING id INTO v_comp_gratin;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'pomme de terre'
     order by ff.canonical_name_normalized limit 1),800,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'creme'
     order by ff.canonical_name_normalized limit 1),200,'ml','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'validated_options',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'comte'
     order by ff.canonical_name_normalized limit 1),80,'g','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Éplucher et émincer finement les pommes de terre.',10,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Disposer en couches, napper de crème, râper le fromage.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,3,'Cuire 45 min à 180 °C.',NULL,45,180,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Poêlée de haricots verts à l''ail','poelee de haricots verts a l ail','diner','legume','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Haricots verts poêlés à l''ail',sd.id,'r0:poelee de haricots verts a l ail','Myko','cc0-1.0',4,5,15,'facile','C','draft','76671694489d880257bfc93f7f056d32'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'haricot vert'
     order by ff.canonical_name_normalized limit 1),500,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'ail'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Cuire les haricots 8 min à l''eau bouillante salée.',NULL,8,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Poêler avec l''ail écrasé 5 min.',5,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_salade uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Salade de pois chiches','salade de pois chiches','dejeuner','legumineuse froide','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Salade de pois chiches',sd.id,'r0:salade de pois chiches','Myko','cc0-1.0',4,10,0,'facile','C','draft','399fd30767c1beb7a71c936061004764'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'salade','main',1) RETURNING id INTO v_comp_salade;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'pois chiche'
     order by ff.canonical_name_normalized limit 1),400,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'tomate'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oignon rouge'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Rincer les pois chiches, couper tomates et oignon.',8,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Mélanger, assaisonner d''huile et de vinaigre.',2,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Quinoa aux légumes','quinoa aux legumes','diner','cereale + legumes','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Quinoa poêlé aux légumes',sd.id,'r0:quinoa aux legumes','Myko','cc0-1.0',4,10,20,'facile','C','draft','30fe9e14bec50d2ea140521b50a7799b'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'quinoa'
     order by ff.canonical_name_normalized limit 1),200,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'carotte'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'poivron rouge'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Cuire le quinoa 15 min dans 2× son volume d''eau.',NULL,15,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Poêler les légumes en dés, mélanger au quinoa.',8,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_poisson uuid; v_comp_riz uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Cabillaud au four et riz','cabillaud au four et riz','diner','poisson + feculent','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Cabillaud au four, riz blanc',sd.id,'r0:cabillaud au four et riz','Myko','cc0-1.0',4,10,25,'facile','C','draft','b0e728a42e79ae3831b329b80e035a1f'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'poisson','protein',1) RETURNING id INTO v_comp_poisson;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'riz','side',2) RETURNING id INTO v_comp_riz;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'cabillaud'
     order by ff.canonical_name_normalized limit 1),600,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'citron'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_riz,'validated_options',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'riz blanc'
     order by ff.canonical_name_normalized limit 1),250,'g','required',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,1,'Déposer le cabillaud avec des rondelles de citron, saler.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,2,'Cuire 20 min à 180 °C.',NULL,20,180,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,3,'Cuire le riz 12 min à l''eau bouillante salée.',NULL,12,NULL,NULL);
END $$;

-- Liste fonctionnelle F0 dérivée de R0 : 21 formes distinctes requises.
