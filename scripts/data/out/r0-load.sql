-- Chargement R0 (recettes candidates). Généré par build-r0.mjs. IDEMPOTENT.
-- corpus_hash = f1bab84b494c59664f7f629c27540e56
insert into ops.source_datasets (code,name,publisher,source_url,license_code,allowed_uses,update_strategy,current_version,last_checked_at)
values ('myko_editorial','Recettes éditoriales Myko','Myko','internal','cc0-1.0',
        '{"store_raw":true,"redistribute":true,"modify":true,"attribution_required":false,"own_content":true}'::jsonb,
        'manual','r0',now())
on conflict (code) do update set last_checked_at=now();

-- Run d'import R0 identifié par le HASH DU CORPUS (un corpus modifié => nouveau run).
insert into ops.import_runs (source_dataset_id, source_version, code_version, configuration_hash, status, started_at, completed_at, candidate_count)
select sd.id, 'r0', 'r0-loader-2.0', 'f1bab84b494c59664f7f629c27540e56', 'completed', now(), now(), 8
from ops.source_datasets sd where sd.code='myko_editorial'
  and not exists (select 1 from ops.import_runs r where r.configuration_hash = 'f1bab84b494c59664f7f629c27540e56');

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_poulet uuid; v_comp_sauce_moutarde uuid; v_comp_puree uuid; v_br_haut_de_cuisse uuid; v_br_cuisse_entiere uuid; v_br_blanc uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Poulet à la moutarde et purée','poulet a la moutarde et puree','diner','proteine + feculent + sauce','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Poulet à la moutarde, purée maison',sd.id,'r0:poulet a la moutarde et puree','Myko','cc0-1.0',4,20,35,'facile','C','draft','31d886918ff948391a9958a9c755177f'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:poulet a la moutarde et puree',to_jsonb('31d886918ff948391a9958a9c755177f'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'poulet','protein',1) RETURNING id INTO v_comp_poulet;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'sauce moutarde','sauce',2) RETURNING id INTO v_comp_sauce_moutarde;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'purée','side',3) RETURNING id INTO v_comp_puree;
  INSERT INTO culinary.recipe_instruction_branches(recipe_version_id,name,selection_condition,confidence_level)
      VALUES(v_ver,'haut de cuisse','{"axis":"morceau","option":"haut de cuisse de poulet cru desosse sans peau"}'::jsonb,'C') RETURNING id INTO v_br_haut_de_cuisse;
  INSERT INTO culinary.recipe_instruction_branches(recipe_version_id,name,selection_condition,confidence_level)
      VALUES(v_ver,'cuisse entière','{"axis":"morceau","option":"cuisse de poulet crue avec os avec peau"}'::jsonb,'C') RETURNING id INTO v_br_cuisse_entiere;
  INSERT INTO culinary.recipe_instruction_branches(recipe_version_id,name,selection_condition,confidence_level)
      VALUES(v_ver,'blanc','{"axis":"morceau","option":"blanc de poulet cru sans peau"}'::jsonb,'C') RETURNING id INTO v_br_blanc;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poulet,'validated_options',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'haut de cuisse de poulet cru desosse sans peau'
     order by ff.canonical_name_normalized limit 1),600,'g','preferred','morceau a mijoter',NULL,false,1);
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'haut de cuisse de poulet cru desosse sans peau'
     order by ff.canonical_name_normalized limit 1), 1, 1, v_br_haut_de_cuisse, 0, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=1
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'haut de cuisse de poulet cru desosse sans peau'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'cuisse de poulet crue avec os avec peau'
     order by ff.canonical_name_normalized limit 1), 2, 1.45, v_br_cuisse_entiere, 0.1, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=1
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'cuisse de poulet crue avec os avec peau'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'blanc de poulet cru sans peau'
     order by ff.canonical_name_normalized limit 1), 3, 1, v_br_blanc, -0.15, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=1
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'blanc de poulet cru sans peau'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poulet,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'huile d olive vierge extra'
     order by ff.canonical_name_normalized limit 1),15,'ml','required','matiere grasse de saisie',NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oignon jaune cru'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'vin blanc sec'
     order by ff.canonical_name_normalized limit 1),100,'ml','recommended','deglacage',NULL,false,4);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'moutarde de dijon'
     order by ff.canonical_name_normalized limit 1),30,'g','required',NULL,NULL,false,5);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_sauce_moutarde,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'creme fraiche epaisse'
     order by ff.canonical_name_normalized limit 1),150,'ml','recommended',NULL,NULL,false,6);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_puree,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'pomme de terre crue epluchee'
     order by ff.canonical_name_normalized limit 1),800,'g','required',NULL,NULL,false,7);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_puree,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'lait demi ecreme'
     order by ff.canonical_name_normalized limit 1),100,'ml','recommended',NULL,NULL,false,8);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_puree,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'beurre doux'
     order by ff.canonical_name_normalized limit 1),30,'g','recommended',NULL,NULL,false,9);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),6,'g','optional',NULL,NULL,true,10);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'poivre noir moulu'
     order by ff.canonical_name_normalized limit 1),1,'g','optional',NULL,NULL,true,11);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Éplucher et émincer l''oignon. Saler et poivrer le poulet.',6,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_haut_de_cuisse,2,'Saisir les hauts de cuisse dans l''huile d''olive 4 min par face, réserver.',10,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_cuisse_entiere,2,'Saisir les cuisses entières côté peau 5 min puis 4 min sur l''autre face, réserver.',12,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_blanc,2,'Saisir les blancs 3 min par face à feu vif, réserver (ne pas dessécher).',6,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,3,'Faire suer l''oignon, déglacer au vin blanc, ajouter moutarde et crème.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_haut_de_cuisse,4,'Remettre les hauts de cuisse, couvrir, mijoter 20 min à feu doux (T° à cœur ≥ 75 °C).',2,20,NULL,75);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_cuisse_entiere,4,'Remettre les cuisses entières, couvrir, mijoter 30 min à feu doux (T° à cœur ≥ 75 °C, l''os ralentit la cuisson).',2,30,NULL,75);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_blanc,4,'Remettre les blancs, couvrir, mijoter 12 min à feu doux (T° à cœur ≥ 75 °C, retirer dès atteinte pour rester moelleux).',2,12,NULL,75);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,5,'Cuire les pommes de terre épluchées 20 min à l''eau salée, écraser avec beurre et lait chaud.',8,20,NULL,NULL);
  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required) VALUES(v_fam,'morceau','single',true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,component_recipe_version_id,confidence_level,status)
      SELECT ax.id, x.name, NULL, 'C','candidate' FROM ax, (VALUES ('Haut de cuisse de poulet cru, désossé, sans peau'),('Cuisse de poulet crue, avec os, avec peau'),('Blanc de poulet cru, sans peau')) AS x(name);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Lentilles vertes mijotées','lentilles vertes mijotees','diner','legumineuse','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Lentilles vertes aux carottes et oignon',sd.id,'r0:lentilles vertes mijotees','Myko','cc0-1.0',4,10,30,'facile','C','draft','023a10334617a2faae26706cf80ddf98'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:lentilles vertes mijotees',to_jsonb('023a10334617a2faae26706cf80ddf98'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'lentille verte seche crue'
     order by ff.canonical_name_normalized limit 1),250,'g','required',NULL,'rincer avant cuisson',false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'carotte crue'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oignon jaune cru'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'huile d olive vierge extra'
     order by ff.canonical_name_normalized limit 1),15,'ml','required','matiere grasse de suée',NULL,false,4);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),5,'g','optional',NULL,NULL,true,5);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Éplucher et tailler oignon et carottes en petits dés.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Faire suer oignon et carottes dans l''huile d''olive.',3,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,3,'Ajouter les lentilles sèches rincées et 2× leur volume d''eau ; mijoter 25-30 min, saler en fin de cuisson.',2,28,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_omelette uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Omelette aux fines herbes','omelette aux fines herbes','diner','oeufs','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Omelette aux fines herbes',sd.id,'r0:omelette aux fines herbes','Myko','cc0-1.0',2,5,5,'facile','C','draft','6644eae057431e3026c95febe75d9b5f'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:omelette aux fines herbes',to_jsonb('6644eae057431e3026c95febe75d9b5f'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'omelette','main',1) RETURNING id INTO v_comp_omelette;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oeuf cru'
     order by ff.canonical_name_normalized limit 1),4,'u','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'persil frais'
     order by ff.canonical_name_normalized limit 1),10,'g','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_omelette,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'beurre doux'
     order by ff.canonical_name_normalized limit 1),15,'g','required','matiere grasse de cuisson',NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),2,'g','optional',NULL,NULL,true,4);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Battre les œufs, ciseler le persil, saler.',3,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Cuire dans le beurre mousseux à feu moyen 3-4 min, plier.',4,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_gratin uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Gratin de pommes de terre','gratin de pommes de terre','diner','feculent gratine','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Gratin de pommes de terre',sd.id,'r0:gratin de pommes de terre','Myko','cc0-1.0',4,15,45,'facile','C','draft','21c900718caf22b94d9e2206074e69a6'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:gratin de pommes de terre',to_jsonb('21c900718caf22b94d9e2206074e69a6'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'gratin','main',1) RETURNING id INTO v_comp_gratin;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'pomme de terre crue epluchee'
     order by ff.canonical_name_normalized limit 1),800,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'creme fraiche epaisse'
     order by ff.canonical_name_normalized limit 1),200,'ml','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'functional_requirement',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'lait demi ecreme'
     order by ff.canonical_name_normalized limit 1),150,'ml','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'validated_options',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'comte'
     order by ff.canonical_name_normalized limit 1),80,'g','recommended','fromage a gratiner',NULL,false,4);
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'comte'
     order by ff.canonical_name_normalized limit 1), 1, 1, NULL, 0, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=4
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'comte'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'gruyere rape'
     order by ff.canonical_name_normalized limit 1), 2, 1, NULL, -0.05, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=4
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'gruyere rape'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_gratin,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'beurre doux'
     order by ff.canonical_name_normalized limit 1),15,'g','recommended','beurrer le plat',NULL,false,5);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),5,'g','optional',NULL,NULL,true,6);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Éplucher et émincer finement les pommes de terre. Beurrer le plat.',10,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Disposer en couches, saler, napper de crème et lait, râper le fromage dessus.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,3,'Cuire 45 min à 180 °C jusqu''à ce que la lame traverse sans résistance.',NULL,45,180,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Poêlée de haricots verts à l''ail','poelee de haricots verts a l ail','diner','legume','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Haricots verts poêlés à l''ail',sd.id,'r0:poelee de haricots verts a l ail','Myko','cc0-1.0',4,5,15,'facile','C','draft','4c769f2ef1f8a9112a9da9ad49defe10'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:poelee de haricots verts a l ail',to_jsonb('4c769f2ef1f8a9112a9da9ad49defe10'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'haricot vert cru'
     order by ff.canonical_name_normalized limit 1),500,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'ail cru'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'beurre doux'
     order by ff.canonical_name_normalized limit 1),20,'g','required','matiere grasse de poêle',NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),4,'g','optional',NULL,NULL,true,4);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Équeuter les haricots, les cuire 8 min à l''eau bouillante salée, égoutter.',3,8,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Poêler dans le beurre avec l''ail écrasé 5 min.',5,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_salade uuid; v_comp_assaisonnement uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Salade de pois chiches','salade de pois chiches','dejeuner','legumineuse froide','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Salade de pois chiches',sd.id,'r0:salade de pois chiches','Myko','cc0-1.0',4,10,0,'facile','C','draft','4d35cf4d33197d521f0549dc79161b24'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:salade de pois chiches',to_jsonb('4d35cf4d33197d521f0549dc79161b24'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'salade','main',1) RETURNING id INTO v_comp_salade;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'assaisonnement','dressing',2) RETURNING id INTO v_comp_assaisonnement;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'pois chiche cuit egoutte'
     order by ff.canonical_name_normalized limit 1),400,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'tomate crue'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_salade,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'oignon rouge cru'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_assaisonnement,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'huile d olive vierge extra'
     order by ff.canonical_name_normalized limit 1),30,'ml','required',NULL,NULL,false,4);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_assaisonnement,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'vinaigre de vin rouge'
     order by ff.canonical_name_normalized limit 1),15,'ml','required',NULL,NULL,false,5);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),3,'g','optional',NULL,NULL,true,6);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Rincer et égoutter les pois chiches. Couper tomates et oignon rouge.',8,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Mélanger, assaisonner d''huile d''olive, de vinaigre et de sel.',2,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_plat uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Quinoa aux légumes','quinoa aux legumes','diner','cereale + legumes','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Quinoa poêlé aux légumes',sd.id,'r0:quinoa aux legumes','Myko','cc0-1.0',4,10,20,'facile','C','draft','473f8d316e39f2793c472fa2a9644bd1'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:quinoa aux legumes',to_jsonb('473f8d316e39f2793c472fa2a9644bd1'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'plat','main',1) RETURNING id INTO v_comp_plat;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'quinoa cru'
     order by ff.canonical_name_normalized limit 1),200,'g','required',NULL,'rincer avant cuisson',false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'carotte crue'
     order by ff.canonical_name_normalized limit 1),2,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'poivron rouge cru'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_plat,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'huile d olive vierge extra'
     order by ff.canonical_name_normalized limit 1),20,'ml','required','matiere grasse de poêle',NULL,false,4);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),4,'g','optional',NULL,NULL,true,5);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Rincer le quinoa, cuire 15 min dans 2× son volume d''eau salée, égoutter.',3,15,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Tailler carotte et poivron en dés, poêler dans l''huile d''olive 8 min, mélanger au quinoa.',8,NULL,NULL,NULL);
END $$;

DO $$
DECLARE v_fam uuid; v_ver uuid; v_comp_poisson uuid; v_comp_riz uuid; v_br_riz_blanc uuid; v_br_riz_complet uuid;
BEGIN
  INSERT INTO culinary.recipe_families(canonical_name,canonical_name_normalized,meal_role,dish_structure,status,confidence_level)
    VALUES('Cabillaud au four et riz','cabillaud au four et riz','diner','poisson + feculent','candidate','C')
    ON CONFLICT (canonical_name_normalized) DO UPDATE SET meal_role=EXCLUDED.meal_role, dish_structure=EXCLUDED.dish_structure RETURNING id INTO v_fam;
  INSERT INTO culinary.recipe_versions(recipe_family_id,version_number,title,source_dataset_id,source_record_key,author_name,source_license,servings,prep_minutes,cook_minutes,difficulty,quality_level,publication_status,content_hash)
    SELECT v_fam,1,'Cabillaud au four, riz blanc',sd.id,'r0:cabillaud au four et riz','Myko','cc0-1.0',4,10,25,'facile','C','draft','28dee05db4c9b5b990a0aad77e822591'
    FROM ops.source_datasets sd WHERE sd.code='myko_editorial'
    ON CONFLICT (recipe_family_id,version_number) DO UPDATE
      SET title=EXCLUDED.title, servings=EXCLUDED.servings, prep_minutes=EXCLUDED.prep_minutes,
          cook_minutes=EXCLUDED.cook_minutes, difficulty=EXCLUDED.difficulty, content_hash=EXCLUDED.content_hash
    RETURNING id INTO v_ver;
  DELETE FROM ops.field_provenance WHERE entity_schema='culinary' AND entity_table='recipe_versions' AND entity_id=v_ver AND field_name='content';
  INSERT INTO ops.field_provenance(entity_schema,entity_table,entity_id,field_name,source_dataset_id,source_record_key,normalized_value,transformation_rule,import_run_id,selected)
    SELECT 'culinary','recipe_versions',v_ver,'content',sd.id,'r0:cabillaud au four et riz',to_jsonb('28dee05db4c9b5b990a0aad77e822591'::text),'myko_editorial_recipe',run.id,true
    FROM ops.source_datasets sd, (SELECT id FROM ops.import_runs WHERE configuration_hash='f1bab84b494c59664f7f629c27540e56' LIMIT 1) run
    WHERE sd.code='myko_editorial';
  DELETE FROM culinary.recipe_requirement_options o USING culinary.recipe_ingredient_requirements r
             WHERE o.requirement_id=r.id AND r.recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_ingredient_requirements WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_steps WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_instruction_branches WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_components WHERE recipe_version_id=v_ver;
  DELETE FROM culinary.recipe_configuration_rules WHERE recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_options vo USING culinary.recipe_variation_axes va
             WHERE vo.variation_axis_id=va.id AND va.recipe_family_id=v_fam;
  DELETE FROM culinary.recipe_variation_axes WHERE recipe_family_id=v_fam;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'poisson','protein',1) RETURNING id INTO v_comp_poisson;
  INSERT INTO culinary.recipe_components(recipe_version_id,name,component_role,position) VALUES(v_ver,'riz','side',2) RETURNING id INTO v_comp_riz;
  INSERT INTO culinary.recipe_instruction_branches(recipe_version_id,name,selection_condition,confidence_level)
      VALUES(v_ver,'riz blanc','{"axis":"riz","option":"riz blanc cru"}'::jsonb,'C') RETURNING id INTO v_br_riz_blanc;
  INSERT INTO culinary.recipe_instruction_branches(recipe_version_id,name,selection_condition,confidence_level)
      VALUES(v_ver,'riz complet','{"axis":"riz","option":"riz complet cru"}'::jsonb,'C') RETURNING id INTO v_br_riz_complet;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'cabillaud cru'
     order by ff.canonical_name_normalized limit 1),600,'g','required',NULL,NULL,false,1);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'citron jaune'
     order by ff.canonical_name_normalized limit 1),1,'u','recommended',NULL,NULL,false,2);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_poisson,'exact_form',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'huile d olive vierge extra'
     order by ff.canonical_name_normalized limit 1),15,'ml','required','arroser le poisson',NULL,false,3);
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,v_comp_riz,'validated_options',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'riz blanc cru'
     order by ff.canonical_name_normalized limit 1),250,'g','required','feculent',NULL,false,4);
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'riz blanc cru'
     order by ff.canonical_name_normalized limit 1), 1, 1, v_br_riz_blanc, 0, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=4
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'riz blanc cru'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_requirement_options(requirement_id,food_form_id,preference_rank,quantity_factor,instruction_branch_id,quality_impact,confidence_level)
        SELECT r.id, (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'riz complet cru'
     order by ff.canonical_name_normalized limit 1), 2, 1, v_br_riz_complet, 0.05, 'C'
        FROM culinary.recipe_ingredient_requirements r
        WHERE r.recipe_version_id=v_ver AND r.position=4
          AND (select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'riz complet cru'
     order by ff.canonical_name_normalized limit 1) IS NOT NULL;
  INSERT INTO culinary.recipe_ingredient_requirements(recipe_version_id,component_id,requirement_type,preferred_food_form_id,quantity,unit,strictness,culinary_role,preparation_note,is_optional,position)
      VALUES(v_ver,NULL,'seasoning_to_taste',(select ff.id from catalog.food_forms ff
     where ff.status <> 'rejected' and ff.canonical_name_normalized = 'sel fin'
     order by ff.canonical_name_normalized limit 1),5,'g','optional',NULL,NULL,true,5);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,1,'Déposer le cabillaud dans un plat, arroser d''huile d''olive, ajouter des rondelles de citron, saler.',5,NULL,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,NULL,2,'Cuire 20 min à 180 °C (T° à cœur ≥ 63 °C).',NULL,20,180,63);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_riz_blanc,3,'Cuire le riz blanc 12 min à l''eau bouillante salée, égoutter.',2,12,NULL,NULL);
  INSERT INTO culinary.recipe_steps(recipe_version_id,branch_id,step_number,instruction,active_minutes,passive_minutes,temperature_c,target_core_temperature_c)
      VALUES(v_ver,v_br_riz_complet,3,'Cuire le riz complet 18 min à l''eau bouillante salée (prévoir plus d''eau), égoutter.',2,18,NULL,NULL);
  WITH ax AS (INSERT INTO culinary.recipe_variation_axes(recipe_family_id,name,selection_mode,required) VALUES(v_fam,'riz','single',true) RETURNING id)
      INSERT INTO culinary.recipe_variation_options(variation_axis_id,name,component_recipe_version_id,confidence_level,status)
      SELECT ax.id, x.name, NULL, 'C','candidate' FROM ax, (VALUES ('Riz blanc cru'),('Riz complet cru')) AS x(name);
END $$;

-- Liste fonctionnelle F0 dérivée de R0 (union préférées + alternatives) : 31 formes distinctes requises.
