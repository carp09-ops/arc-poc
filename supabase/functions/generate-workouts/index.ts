import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const MODEL = "gpt-5.6-luna";
const AI_TIMEOUT_MS = 12000;
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function response(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders });
}

function publishableKey() {
  const raw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.default) return parsed.default;
      const first = Object.values(parsed)[0];
      if (typeof first === "string") return first;
    } catch (_) {}
  }
  return Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
}

function cleanText(value: unknown, max = 240) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function equipmentSet(value: unknown) {
  return new Set((Array.isArray(value) ? value : []).map((x) => String(x).trim()).filter(Boolean));
}

function hasAny(equipment: Set<string>, values: string[]) {
  return values.some((value) => equipment.has(value));
}

function hasFullGym(equipment: Set<string>) {
  return equipment.has("Full gym");
}

function hasSafetyConcern(limitations: unknown) {
  const text = String(limitations || "").toLowerCase();
  return /(pain|injur|strain|sprain|dizz|faint|fever|illness|sick|pregnan|postpartum|shortness of breath|chest pain|sharp|acute)/i.test(text);
}

function latestReadiness(context: Record<string, unknown>) {
  const rows = Array.isArray(context.wearable_context) ? context.wearable_context as Array<Record<string, unknown>> : [];
  const score = Number(rows[0]?.readiness_score);
  return Number.isFinite(score) ? score : null;
}

function safeRecommendedTier(candidate: string, context: Record<string, unknown>) {
  const energy = Number(context.energy);
  const soreness = Number(context.soreness);
  const desired = String(context.desired_effort);
  const readiness = latestReadiness(context);
  const concern = hasSafetyConcern(context.limitations);

  if (energy <= 2 || soreness >= 4 || concern || (readiness != null && readiness < 55)) return "restore";
  if (candidate === "push") {
    if (energy < 4 || soreness > 2 || desired === "restore" || (readiness != null && readiness < 70)) return "build";
    return "push";
  }
  if (candidate === "restore") return "restore";
  if (desired === "push" && energy >= 4 && soreness <= 2 && (readiness == null || readiness >= 70)) return candidate === "build" ? "build" : "push";
  return "build";
}

function primaryEquipment(equipment: Set<string>) {
  if (hasFullGym(equipment) || equipment.has("Dumbbells")) return "dumbbell";
  if (equipment.has("Kettlebells")) return "kettlebell";
  if (equipment.has("Barbell + rack")) return "barbell";
  if (equipment.has("Resistance bands")) return "bands";
  if (equipment.has("Cable machine")) return "cable";
  return "bodyweight";
}

function ruleLibrary(equipmentValue: unknown) {
  const equipment = equipmentSet(equipmentValue);
  const mode = primaryEquipment(equipment);

  const bodyweight = {
    restore: [["Mobility Flow",2,"6 min"],["Bodyweight Squat",2,"10"],["Incline Push-Up",2,"8"],["Dead Bug",2,"8 / side"]],
    build: [["Tempo Squat",3,"12"],["Push-Up",3,"8–12"],["Reverse Lunge",3,"10 / side"],["Glute Bridge",3,"15"],["Plank",3,"30 sec"]],
    push: [["Jump Squat",4,"10"],["Push-Up",4,"10–15"],["Walking Lunge",4,"12 / side"],["Single-Leg Glute Bridge",3,"12 / side"],["Mountain Climber",4,"30 sec"]],
  };
  const dumbbell = {
    restore: [["Mobility Flow",2,"6 min"],["Goblet Squat",2,"10"],["Dumbbell Floor Press",2,"10"],["Dead Bug",2,"8 / side"]],
    build: [["Goblet Squat",3,"8–10"],["Dumbbell Floor Press",3,"8–10"],["One-Arm Dumbbell Row",3,"10 / side"],["Dumbbell Romanian Deadlift",3,"10"],["Plank",3,"30 sec"]],
    push: [["Dumbbell Front Squat",4,"8"],["Dumbbell Floor Press",4,"8"],["Dumbbell Romanian Deadlift",4,"8"],["One-Arm Dumbbell Row",4,"10 / side"],["Dumbbell Thruster",3,"10"]],
  };
  const kettlebell = {
    restore: [["Mobility Flow",2,"6 min"],["Kettlebell Goblet Squat",2,"10"],["Kettlebell Deadlift",2,"10"],["Dead Bug",2,"8 / side"]],
    build: [["Kettlebell Goblet Squat",3,"10"],["Kettlebell Deadlift",3,"10"],["Half-Kneeling Kettlebell Press",3,"8 / side"],["One-Arm Kettlebell Row",3,"10 / side"],["Plank",3,"30 sec"]],
    push: [["Kettlebell Front Squat",4,"8"],["Kettlebell Swing",4,"12"],["Kettlebell Push Press",4,"8 / side"],["One-Arm Kettlebell Row",4,"10 / side"],["Mountain Climber",3,"30 sec"]],
  };
  const barbell = {
    restore: [["Mobility Flow",2,"6 min"],["Bodyweight Squat",2,"10"],["Barbell Romanian Deadlift",2,"8"],["Dead Bug",2,"8 / side"]],
    build: [["Barbell Back Squat",3,"6–8"],["Barbell Romanian Deadlift",3,"8"],["Barbell Bent-Over Row",3,"8–10"],["Push-Up",3,"8–12"],["Plank",3,"30 sec"]],
    push: [["Barbell Back Squat",4,"6"],["Barbell Romanian Deadlift",4,"6–8"],["Barbell Bent-Over Row",4,"8"],["Push-Up",4,"10–15"],["Mountain Climber",4,"30 sec"]],
  };
  const bands = {
    restore: [["Mobility Flow",2,"6 min"],["Band Squat",2,"12"],["Band Row",2,"12"],["Dead Bug",2,"8 / side"]],
    build: [["Band Squat",3,"12"],["Band Chest Press",3,"10–12"],["Band Row",3,"12"],["Band Romanian Deadlift",3,"12"],["Plank",3,"30 sec"]],
    push: [["Band Squat",4,"12"],["Band Chest Press",4,"10"],["Band Row",4,"12"],["Band Romanian Deadlift",4,"10"],["Mountain Climber",4,"30 sec"]],
  };
  const cable = {
    restore: [["Mobility Flow",2,"6 min"],["Bodyweight Squat",2,"10"],["Cable Row",2,"12"],["Dead Bug",2,"8 / side"]],
    build: [["Goblet-Style Cable Squat",3,"10"],["Cable Chest Press",3,"10"],["Cable Row",3,"10"],["Cable Pull-Through",3,"12"],["Plank",3,"30 sec"]],
    push: [["Cable Squat",4,"10"],["Cable Chest Press",4,"8–10"],["Cable Row",4,"10"],["Cable Pull-Through",4,"10"],["Mountain Climber",4,"30 sec"]],
  };
  return ({ bodyweight, dumbbell, kettlebell, barbell, bands, cable } as Record<string, typeof bodyweight>)[mode] || bodyweight;
}

function ruleGeneration(context: Record<string, unknown>) {
  const energy = Number(context.energy);
  const soreness = Number(context.soreness);
  const desired = String(context.desired_effort);
  const available = Number(context.available_minutes);
  const rawCandidate = energy <= 2 || soreness >= 4 ? "restore" : desired === "push" && energy >= 4 && soreness <= 2 ? "push" : "build";
  const recommended = safeRecommendedTier(rawCandidate, context);
  const summary = recommended === "restore" ? "Recovery wins today. Keep the habit without forcing intensity." : recommended === "push" ? "You have the runway to press." : "Balanced work is the best fit for today.";
  const durations = { restore: Math.max(10, Math.min(available,20)), build: Math.max(10, Math.min(available,35)), push: Math.max(10, Math.min(available,50)) };
  const library = ruleLibrary(context.equipment) as Record<string, Array<[string,number,string]>>;
  return {
    summary,
    recommended_tier: recommended,
    options: ["restore","build","push"].map((tier) => ({
      tier,
      title: tier === "restore" ? "Restore" : tier === "push" ? "Push" : "Build",
      focus: tier === "restore" ? "Mobility + Recovery" : tier === "push" ? "Strength + Conditioning" : "Strength + Full Body",
      duration_minutes: durations[tier as keyof typeof durations],
      intensity: tier === "restore" ? "low" : tier === "push" ? "high" : "moderate",
      rationale: tier === "restore" ? "Move well, reduce friction and protect the training habit." : tier === "push" ? "Use the energy you have today for a demanding, focused session." : "A balanced session that moves strength forward without emptying the tank.",
      exercises: library[tier].map((x) => ({ exercise_name:x[0], target_sets:x[1], target_reps:x[2] })),
    })),
  };
}

function equipmentCompatible(name: string, equipmentValue: unknown) {
  const equipment = equipmentSet(equipmentValue);
  if (hasFullGym(equipment)) return true;
  const checks: Array<[RegExp,string[]]> = [
    [/dumbbell|\bdb\b/i,["Dumbbells"]],
    [/barbell/i,["Barbell + rack"]],
    [/kettlebell|\bkb\b/i,["Kettlebells"]],
    [/resistance band|\bband\b/i,["Resistance bands"]],
    [/cable/i,["Cable machine"]],
    [/pull[- ]?up|chin[- ]?up/i,["Pull-up bar"]],
    [/bench/i,["Adjustable bench"]],
    [/treadmill|elliptical|stationary bike|exercise bike|rowing machine|rower/i,["Cardio equipment"]],
  ];
  for (const [pattern, allowed] of checks) {
    if (pattern.test(name) && !hasAny(equipment, allowed)) return false;
  }
  return true;
}

function extractResponseText(payload: any) {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

function normalizeGeneration(parsed: any, context: Record<string, unknown>) {
  if (!parsed || !Array.isArray(parsed.options) || parsed.options.length !== 3) throw new Error("invalid_option_count");
  const required = ["restore","build","push"];
  const tiers = new Set(parsed.options.map((x:any) => x.tier));
  if (required.some((tier) => !tiers.has(tier)) || tiers.size !== 3) throw new Error("invalid_tiers");
  if (!required.includes(parsed.recommended_tier)) throw new Error("invalid_recommendation");
  const available = Number(context.available_minutes);

  const normalized = parsed.options.map((option:any) => {
    if (!Array.isArray(option.exercises) || option.exercises.length < 3 || option.exercises.length > 8) throw new Error("invalid_exercise_count");
    const seen = new Set<string>();
    const exercises = option.exercises.map((exercise:any) => {
      const exerciseName = cleanText(exercise.exercise_name, 80);
      if (!exerciseName) throw new Error("missing_exercise_name");
      const key = exerciseName.toLowerCase();
      if (seen.has(key)) throw new Error("duplicate_exercise");
      seen.add(key);
      if (!equipmentCompatible(exerciseName, context.equipment)) throw new Error("equipment_mismatch");
      const sets = Number(exercise.target_sets);
      if (!Number.isInteger(sets) || sets < 1 || sets > 6) throw new Error("invalid_sets");
      const reps = cleanText(exercise.target_reps, 40);
      if (!reps) throw new Error("invalid_reps");
      return { exercise_name:exerciseName, target_sets:sets, target_reps:reps };
    });
    const tier = option.tier;
    return {
      tier,
      title: tier === "restore" ? "Restore" : tier === "push" ? "Push" : "Build",
      focus: cleanText(option.focus, 80) || (tier === "restore" ? "Mobility + Recovery" : tier === "push" ? "Strength + Conditioning" : "Strength + Full Body"),
      duration_minutes: Math.max(10, Math.min(available, Number(option.duration_minutes) || available)),
      intensity: tier === "restore" ? "low" : tier === "push" ? "high" : "moderate",
      rationale: cleanText(option.rationale, 260),
      exercises,
    };
  });

  return {
    summary: cleanText(parsed.summary, 280) || "Three paths forward. You choose.",
    recommended_tier: safeRecommendedTier(parsed.recommended_tier, context),
    options: normalized.sort((a:any,b:any) => required.indexOf(a.tier) - required.indexOf(b.tier)),
  };
}

async function aiGeneration(context: Record<string, unknown>) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;
  const schema = {
    type:"object", additionalProperties:false, required:["summary","recommended_tier","options"],
    properties:{
      summary:{type:"string"},
      recommended_tier:{type:"string",enum:["restore","build","push"]},
      options:{type:"array",minItems:3,maxItems:3,items:{
        type:"object",additionalProperties:false,required:["tier","focus","duration_minutes","rationale","exercises"],
        properties:{
          tier:{type:"string",enum:["restore","build","push"]},
          focus:{type:"string"},
          duration_minutes:{type:"integer",minimum:10,maximum:180},
          rationale:{type:"string"},
          exercises:{type:"array",minItems:3,maxItems:8,items:{
            type:"object",additionalProperties:false,required:["exercise_name","target_sets","target_reps"],
            properties:{exercise_name:{type:"string"},target_sets:{type:"integer",minimum:1,maximum:6},target_reps:{type:"string"}}
          }}
        }
      }}
    }
  };

  const system = `You are Arc's workout recommendation engine. Arc helps a user choose the right effort for today and rewards sustainable consistency; 80% is success. Return exactly three distinct options: Restore, Build, and Push. The user always chooses. Never shame them and never make Restore sound like failure.

Use readiness answers, goal, available time, equipment, recent completed training, and wearable context when available. Recent training is context for sensible variety and continuity, not permission to over-progress. Avoid exact repetition when a useful alternative exists, but keep familiar foundational movements when they make sense. Do not prescribe target weight loads; Arc logs load separately. Respect the user's listed equipment exactly. If Full gym is listed, standard gym equipment is allowed; otherwise never introduce equipment that is not listed.

Safety rules: do not diagnose, treat injuries, or prescribe rehabilitation. If limitations mention pain, injury, dizziness, illness, pregnancy/postpartum, chest pain, fainting, or another concern, be conservative, avoid aggravating movements, and favor Restore or Build. Restore must remain a real workout option. Push may be offered but should only be recommended when the supplied context clearly supports it. Keep all sessions general fitness training for an adult and within the available time.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method:"POST",
      signal:controller.signal,
      headers:{"Authorization":`Bearer ${apiKey}`,"Content-Type":"application/json"},
      body:JSON.stringify({
        model:MODEL,
        reasoning:{effort:"low"},
        max_output_tokens:2200,
        input:[
          {role:"system",content:[{type:"input_text",text:system}]},
          {role:"user",content:[{type:"input_text",text:JSON.stringify(context)}]},
        ],
        text:{format:{type:"json_schema",name:"arc_workout_recommendations",strict:true,schema}},
      }),
    });
    if (!apiResponse.ok) throw new Error(`openai_${apiResponse.status}`);
    const payload = await apiResponse.json();
    const text = extractResponseText(payload);
    if (!text) throw new Error("openai_empty_output");
    return normalizeGeneration(JSON.parse(text), context);
  } finally {
    clearTimeout(timeout);
  }
}

async function recentTrainingContext(supabase:any, userId:string) {
  const { data:sessions, error:sessionError } = await supabase.from("workout_sessions")
    .select("id,name,completed_at,perceived_effort")
    .eq("user_id",userId).eq("status","completed")
    .order("completed_at",{ascending:false}).limit(4);
  if (sessionError || !sessions?.length) return [];
  const ids = sessions.map((x:any) => x.id);
  const { data:exercises, error:exerciseError } = await supabase.from("workout_session_exercises")
    .select("id,workout_session_id,exercise_name,sort_order")
    .in("workout_session_id",ids).order("sort_order");
  if (exerciseError) return [];
  const exerciseIds = (exercises || []).map((x:any) => x.id);
  let sets:any[] = [];
  if (exerciseIds.length) {
    const setRes = await supabase.from("workout_sets")
      .select("workout_exercise_id,reps,weight_kg,duration_seconds,completed")
      .in("workout_exercise_id",exerciseIds);
    if (!setRes.error) sets = setRes.data || [];
  }
  const setsByExercise = new Map<string,any[]>();
  for (const set of sets) {
    if (!setsByExercise.has(set.workout_exercise_id)) setsByExercise.set(set.workout_exercise_id,[]);
    setsByExercise.get(set.workout_exercise_id)!.push(set);
  }
  const exercisesBySession = new Map<string,any[]>();
  for (const exercise of exercises || []) {
    const logged = (setsByExercise.get(exercise.id) || []).filter((x:any) => x.completed);
    const summary:any = { name:cleanText(exercise.exercise_name,80), completed_sets:logged.length };
    const reps = logged.map((x:any) => Number(x.reps)).filter(Number.isFinite);
    const weights = logged.map((x:any) => Number(x.weight_kg)).filter(Number.isFinite);
    const durations = logged.map((x:any) => Number(x.duration_seconds)).filter(Number.isFinite);
    if (reps.length) summary.max_reps = Math.max(...reps);
    if (weights.length) summary.max_weight_kg = Math.round(Math.max(...weights)*10)/10;
    if (durations.length) summary.max_duration_seconds = Math.max(...durations);
    if (!exercisesBySession.has(exercise.workout_session_id)) exercisesBySession.set(exercise.workout_session_id,[]);
    exercisesBySession.get(exercise.workout_session_id)!.push(summary);
  }
  return sessions.map((session:any) => ({
    completed_on: session.completed_at ? String(session.completed_at).slice(0,10) : null,
    name: cleanText(session.name,80),
    perceived_effort: session.perceived_effort || null,
    exercises: exercisesBySession.get(session.id) || [],
  }));
}

Deno.serve(async (req:Request) => {
  if (req.method === "OPTIONS") return new Response("ok",{headers:corsHeaders});
  if (req.method !== "POST") return response({error:"Method not allowed"},405);

  const requestId = crypto.randomUUID();
  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = publishableKey();
  if (!authHeader || !url || !key) return response({error:"Authentication unavailable",request_id:requestId},401);

  const supabase = createClient(url,key,{global:{headers:{Authorization:authHeader}},auth:{persistSession:false,autoRefreshToken:false}});
  const { data:authData, error:authError } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authError || !user) return response({error:"Unauthorized",request_id:requestId},401);

  let input:Record<string,unknown>;
  try { input = await req.json(); } catch (_) { return response({error:"Invalid JSON body",request_id:requestId},400); }
  const energy = Number(input.energy);
  const soreness = Number(input.soreness);
  const availableMinutes = Number(input.available_minutes);
  const desiredEffort = String(input.desired_effort || "");
  const limitations = typeof input.limitations === "string" && input.limitations.trim() ? cleanText(input.limitations,300) : null;
  if (!Number.isInteger(energy) || energy < 1 || energy > 5 || !Number.isInteger(soreness) || soreness < 1 || soreness > 5 || !Number.isInteger(availableMinutes) || availableMinutes < 10 || availableMinutes > 180 || !["restore","build","push"].includes(desiredEffort)) {
    return response({error:"Invalid readiness answers",request_id:requestId},400);
  }

  const [profileRes, wearableRes, recentTraining] = await Promise.all([
    supabase.from("profiles").select("primary_goal,equipment").eq("user_id",user.id).maybeSingle(),
    supabase.from("wearable_daily_metrics").select("metric_date,sleep_minutes,readiness_score,resting_hr,hrv_ms,steps,workout_minutes").eq("user_id",user.id).order("metric_date",{ascending:false}).limit(3),
    recentTrainingContext(supabase,user.id),
  ]);
  if (profileRes.error) return response({error:profileRes.error.message,request_id:requestId},400);
  if (wearableRes.error) return response({error:wearableRes.error.message,request_id:requestId},400);
  const equipment = Array.isArray(profileRes.data?.equipment) ? profileRes.data.equipment : [];
  const contextSnapshot:Record<string,unknown> = {
    energy,soreness,available_minutes:availableMinutes,desired_effort:desiredEffort,limitations,
    primary_goal:profileRes.data?.primary_goal || null,
    equipment,
    wearable_context:wearableRes.data || [],
    recent_training:recentTraining,
  };

  let generation = ruleGeneration(contextSnapshot);
  let generatorVersion = "edge-rules-v3";
  let engineMode = "rules";
  let fallbackReason:string|null = Deno.env.get("OPENAI_API_KEY") ? null : "missing_api_key";
  if (Deno.env.get("OPENAI_API_KEY")) {
    try {
      const ai = await aiGeneration(contextSnapshot);
      if (ai) {
        generation = ai;
        generatorVersion = `openai-${MODEL}-v2`;
        engineMode = "ai";
        fallbackReason = null;
      }
    } catch (error) {
      fallbackReason = error instanceof DOMException && error.name === "AbortError" ? "ai_timeout" : cleanText((error as Error)?.message || "ai_error",80);
      console.error("AI generation failed; using deterministic fallback",{requestId,fallbackReason});
    }
  }

  const persistedContext = {...contextSnapshot,generation_mode:engineMode};
  if (fallbackReason) (persistedContext as any).fallback_reason = fallbackReason;

  const { data:checkin, error:checkinError } = await supabase.from("readiness_checkins").insert({user_id:user.id,energy,soreness,available_minutes:availableMinutes,desired_effort:desiredEffort,limitations}).select().single();
  if (checkinError) return response({error:checkinError.message,request_id:requestId},400);
  const { data:recommendationSet, error:setError } = await supabase.from("workout_recommendation_sets").insert({
    user_id:user.id,checkin_id:checkin.id,recommendation_summary:generation.summary,context_snapshot:persistedContext,generator_version:generatorVersion,
  }).select().single();
  if (setError) return response({error:setError.message,request_id:requestId},400);

  const optionRows = generation.options.map((option:any) => ({
    user_id:user.id,recommendation_set_id:recommendationSet.id,tier:option.tier,title:option.title,focus:option.focus,duration_minutes:option.duration_minutes,intensity:option.intensity,rationale:option.rationale,equipment,is_recommended:option.tier === generation.recommended_tier,
  }));
  const { data:options, error:optionsError } = await supabase.from("workout_options").insert(optionRows).select();
  if (optionsError) return response({error:optionsError.message,request_id:requestId},400);
  const sourceByTier = new Map(generation.options.map((option:any) => [option.tier,option]));
  const exerciseRows:Array<Record<string,unknown>> = [];
  for (const option of options || []) {
    const generated = sourceByTier.get(option.tier) as any;
    for (const [index,exercise] of (generated?.exercises || []).entries()) {
      exerciseRows.push({user_id:user.id,workout_option_id:option.id,sort_order:index+1,exercise_name:exercise.exercise_name,target_sets:exercise.target_sets,target_reps:exercise.target_reps});
    }
  }
  const { error:exercisesError } = await supabase.from("workout_option_exercises").insert(exerciseRows);
  if (exercisesError) return response({error:exercisesError.message,request_id:requestId},400);

  return response({summary:generation.summary,recommended_tier:generation.recommended_tier,generator_version:generatorVersion,engine_mode:engineMode,request_id:requestId,options:options || []});
});
