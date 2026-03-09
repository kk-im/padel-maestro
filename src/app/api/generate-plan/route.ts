import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDefaultPlan } from "@/lib/data/default-plan";
import type { Profile } from "@/types";

export async function POST() {
  try {
    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Get profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // 3. Generate plan from profile
    const planData = generateDefaultPlan(profile as Profile);

    // 4. Save to training_plans
    const { error: insertError } = await supabase
      .from("training_plans")
      .insert({
        user_id: user.id,
        plan_data: planData,
        version: 1,
        is_active: true,
      });

    if (insertError) {
      console.error("Failed to save plan:", insertError);
      return NextResponse.json(
        { error: "Failed to save plan" },
        { status: 500 }
      );
    }

    // 5. Return plan data
    return NextResponse.json({ plan_data: planData });
  } catch (error) {
    console.error("Generate plan error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
