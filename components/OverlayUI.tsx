const saveSticky = async () => {
  if (!pose.screenPoint) return;

  if (!supabase) {
    alert("Supabase の環境変数が未設定です。");
    return;
  }

  try {
    setSaving(true);
    setSaved(false);

    const { error } = await supabase.from("stickies").insert({
      text: note,
      x: pose.screenPoint.x,
      y: pose.screenPoint.y,
      distance_score: pose.distanceScore,
    });

    if (error) throw error;
    setSaved(true);
  } catch (e) {
    console.error(e);
    alert("Supabase保存に失敗しました。");
  } finally {
    setSaving(false);
  }
};