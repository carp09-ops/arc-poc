import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.116.0";

const MODEL = "gpt-5.6-luna";
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
    } catch (_) {
      // Fall through to compatibility environment variables.
    }
  }
  return Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
}

function recommendedTier(energy: number, soreness: number, desired: string) {
  if (energy <= 2 || soreness >= 4) return "restore";
  if (desired === "push" && energy >= 4 && soreness <= 2) return "push";
  return "build";
}

function exerciseLibrary(hasEquipment: boolean) {
  if (hasEquipment) {
    return {
      restore: [["Mobility Flow", 2, "6 min"], ["Goblet Squat", 2, "10"], ["Incline Dumbbell Press", 2, "10"], ["Dead Bug", 2, "8 / side"]],
      build: [["Goblet Squat", 3, "8–10"], ["Dumbbell Bench Press", 3, "8–10"], ["One-Arm Row", 3, "10 / side"], ["Romanian Deadlift", 3, "10"], ["Plank", 3, "30 sec"]],
      push: [["Dumbbell Front Squat", 4, "8"], ["Dumbbell Bench Press", 4, "8"], ["Romanian Deadlift", 4, "8"], ["One-Arm Row", 4, "10 / side"], ["DB Thruster Finisher", 3, "10"]],
    };
  }
  return {
    restore: [["Mobility Flow", 2, "6 min"], ["Bodyweight Squat", 2, "10"], ["Incline Push-Up", 2, "8"], ["Dead Bug", 2, "8 / side"]],
    build: [["Tempo Squat", 3, "12"], ["Push-Up", 3, "8–12"], ["Reverse Lunge", 3, "10 / side"], ["Glute Bridge", 3, "15"], ["Plank", 3, "30 sec"]],
    push: [["Jump Squat", 4, "10"], ["Push-Up", 4, "10–15"], ["Walking Lunge", 4, "12 / side"], ["Single-Leg Glute Bridge", 3, "12 / side"], ["Mountain Climber", 4, "30 sec"]],
  };
}

function ruleGeneration(context: Record<string, unknown>) {
  const energy = Number(context.energy);
  const soreness = Number(context.soreness);
  const desiredEffort = String(context.desired_effort);
  const availableMinutes = Number(context.available_minutes);
  const equipment = Array.isArray(context.equipment) ? context.equipment : [];
  const tier = recommendedTier(energy, soreness, desiredEffort);
  const summary = tier === "restore"
    ? "Recovery wins today. Keep the habit without forcing intensity."
    : tier === "push"
      ? "You have the runway to press."
      : "Balanced work is the best fit for today.";
  const durations = {
    restore: Math.max(10, Math.min(availableMinutes, 20)),
    build: Math.max(10, Math.min(availableMinutes, 35)),
    push: Math.max(10, Math.min(availableMinutes, 50)),
  };
  const configs = {
    restore: { title: "Restore", focus: "Mobility + Recovery", intensity: "low", rationale: "Move well, reduce friction and protect the training habit." },
    build: { title: "Build", focus: "Strength + Full Body", intensity: "moderate", rationale: "A balanced session that moves strength forward without emptying the tank." },
    push: { title: "Push", focus: "Strength + Conditioning", intensity: "high", rationale: "Use the energy you have today for a demanding, focused session." },
  } as const;
  const library = exerciseLibrary(equipment.length > 0) as Record<string, Array<[string, number, string]>>;
  return {
    summary,
    recommended_tier: tier,
    options: (Object.keys(configs) as Array<keyof typeof configs>).map((optionTier) => ({
      tier: optionTier,
      title: configs[optionTier].title,
      focus: configs[optionTier].focus,
      duration_minutes: durations[optionTier],
      intensity: configs[optionTier].intensity,
      rationale: configs[optionTier].rationale,
      exercises: library[optionTier].map((exercise) => ({
        exercise_name: exercise[0],
        target_sets: exercise[1],
        target_reps: exercise[2],
      })),
    })),
  };
}

function extractResponseText(payload: any) {
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

function normalizeGeneration(parsed: any, availableMinutes: number) {
  if (!parsed || !Array.isArray(parsed.options) || parsed.options.length !== 3) throw new Error("Invalid option count");
  const required = ["restore", "build", "push"];
  const tiers = new Set(parsed.options.map((o: any) => o.tier));
  if (required.some((tier) => !tiers.has(tier))) throw new Error("Missing workout tier");
  if (!required.includes(parsed.recommended_tier)) throw new Error("Invalid recommended tier");

  return {
    summary: String(parsed.summary || "Three paths forward. You choose."),
    recommended_tier: parsed.recommended_tier,
    options: parsed.options.map((option: any) => ({
      tier: option.tier,
      title: String(option.title),
      focus: String(option.focus),
      duration_minutes: Math.max(10, Math.min(availableMinutes, Number(option.duration_minutes))),
      intensity: option.intensity,
      rationale: String(option.rationale),
      exercises: option.exercises.map((exercise: any) => ({
        exercise_name: String(exercise.exercise_name),
        target_sets: Number(exercise.target_sets),
        target_reps: String(exercise.target_reps),
      })),
    })),
  };
}

async function aiGeneration(context: Record<string, unknown>) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) return null;

  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["summary", "recommended_tier", "options"],
    properties: {
      summary: { type: "string" },
      recommended_tier: { type: "string", enum: ["restore", "build", "push"] },
      options: {
        type: "array",
        minItems: 3,
        maxItems: 3,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["tier", "title", "focus", "duration_minutes", "intensity", "rationale", "exercises"],
          properties: {
            tier: { type: "string", enum: ["restore", "build", "push"] },
            title: { type: "string" },
            focus: { type: "string" },
            duration_minutes: { type: "integer", minimum: 10, maximum: 180 },
            intensity: { type: "string", enum: ["low", "moderate", "high"] },
            rationale: { type: "string" },
            exercises: {
              type: "array",
              minItems: 3,
              maxItems: 8,
              items: {
                type: "object",
                additionalProperties: false,
                required: ["exercise_name", "target_sets", "target_reps"],
                properties: {
                  exercise_name: { type: "string" },
                  target_sets: { type: "integer", minimum: 1, maximum: 6 },
                  target_reps: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
  };

  const system = `You are Arc's workout recommendation engine. Create exactly three safe, practical options named Restore, Build, and Push. The user decides; never shame them or imply Restore is failure. 80% consistency is success in Arc, so protect sustainable effort over perfection. Respect the user's available time and listed equipment. If limitations mention pain, injury, dizziness, illness, pregnancy, or another concern, do not diagnose or prescribe rehabilitation; be conservative, avoid aggravating movements, and prefer Restore when risk is unclear. Keep the sessions general fitness workouts suitable for an adult unless the supplied context says otherwise.`;

  const apiResponse = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: [{ type: "input_text", text: system }] },
        { role: "user", content: [{ type: "input_text", text: JSON.stringify(context) }] },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "arc_workout_recommendations",
          strict: true,
          schema,
        },
      },
    }),
  });

  if (!apiResponse.ok) throw new Error(`OpenAI request failed: ${apiResponse.status}`);
  const payload = await apiResponse.json();
  const text = extractResponseText(payload);
  if (!text) throw new Error("OpenAI returned no structured text");
  return normalizeGeneration(JSON.parse(text), Number(context.available_minutes));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = publishableKey();
  if (!authHeader || !url || !key) return response({ error: "Authentication unavailable" }, 401);

  const supabase = createClient(url, key, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData?.user;
  if (authError || !user) return response({ error: "Unauthorized" }, 401);

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch (_) {
    return response({ error: "Invalid JSON body" }, 400);
  }

  const energy = Number(input.energy);
  const soreness = Number(input.soreness);
  const availableMinutes = Number(input.available_minutes);
  const desiredEffort = String(input.desired_effort || "");
  const limitations = typeof input.limitations === "string" && input.limitations.trim() ? input.limitations.trim() : null;

  if (!Number.isInteger(energy) || energy < 1 || energy > 5 ||
      !Number.isInteger(soreness) || soreness < 1 || soreness > 5 ||
      !Number.isInteger(availableMinutes) || availableMinutes < 10 || availableMinutes > 180 ||
      !["restore", "build", "push"].includes(desiredEffort)) {
    return response({ error: "Invalid readiness answers" }, 400);
  }

  const [{ data: profile, error: profileError }, { data: wearable, error: wearableError }] = await Promise.all([
    supabase.from("profiles").select("primary_goal,equipment").eq("user_id", user.id).maybeSingle(),
    supabase.from("wearable_daily_metrics")
      .select("metric_date,sleep_minutes,readiness_score,resting_hr,hrv_ms,steps,workout_minutes")
      .eq("user_id", user.id)
      .order("metric_date", { ascending: false })
      .limit(3),
  ]);
  if (profileError) return response({ error: profileError.message }, 400);
  if (wearableError) return response({ error: wearableError.message }, 400);

  const equipment = Array.isArray(profile?.equipment) ? profile.equipment : [];
  const contextSnapshot = {
    energy,
    soreness,
    available_minutes: availableMinutes,
    desired_effort: desiredEffort,
    limitations,
    primary_goal: profile?.primary_goal || null,
    equipment,
    wearable_context: wearable || [],
  };

  let generation = ruleGeneration(contextSnapshot);
  let generatorVersion = "edge-rules-v2";
  if (Deno.env.get("OPENAI_API_KEY")) {
    try {
      const modelGeneration = await aiGeneration(contextSnapshot);
      if (modelGeneration) {
        generation = modelGeneration;
        generatorVersion = `openai-${MODEL}-v1`;
      }
    } catch (error) {
      console.error("AI generation failed; using rules fallback", error);
    }
  }

  const { data: checkin, error: checkinError } = await supabase.from("readiness_checkins").insert({
    user_id: user.id,
    energy,
    soreness,
    available_minutes: availableMinutes,
    desired_effort: desiredEffort,
    limitations,
  }).select().single();
  if (checkinError) return response({ error: checkinError.message }, 400);

  const { data: recommendationSet, error: setError } = await supabase.from("workout_recommendation_sets").insert({
    user_id: user.id,
    checkin_id: checkin.id,
    recommendation_summary: generation.summary,
    context_snapshot: contextSnapshot,
    generator_version: generatorVersion,
  }).select().single();
  if (setError) return response({ error: setError.message }, 400);

  const optionRows = generation.options.map((option: any) => ({
    user_id: user.id,
    recommendation_set_id: recommendationSet.id,
    tier: option.tier,
    title: option.title,
    focus: option.focus,
    duration_minutes: option.duration_minutes,
    intensity: option.intensity,
    rationale: option.rationale,
    equipment,
    is_recommended: option.tier === generation.recommended_tier,
  }));
  const { data: options, error: optionsError } = await supabase.from("workout_options").insert(optionRows).select();
  if (optionsError) return response({ error: optionsError.message }, 400);

  const sourceByTier = new Map(generation.options.map((option: any) => [option.tier, option]));
  const exerciseRows: Array<Record<string, unknown>> = [];
  for (const option of options || []) {
    const generated = sourceByTier.get(option.tier) as any;
    for (const [index, exercise] of (generated?.exercises || []).entries()) {
      exerciseRows.push({
        user_id: user.id,
        workout_option_id: option.id,
        sort_order: index + 1,
        exercise_name: exercise.exercise_name,
        target_sets: exercise.target_sets,
        target_reps: exercise.target_reps,
      });
    }
  }
  const { error: exercisesError } = await supabase.from("workout_option_exercises").insert(exerciseRows);
  if (exercisesError) return response({ error: exercisesError.message }, 400);

  return response({
    summary: generation.summary,
    recommended_tier: generation.recommended_tier,
    generator_version: generatorVersion,
    options: options || [],
  });
});
