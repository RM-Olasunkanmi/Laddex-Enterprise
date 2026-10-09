const action = process.argv[2];
const destructiveActions = new Set(["reset", "seed"]);

if (!destructiveActions.has(action)) {
  console.error(`Unknown guarded action: ${action ?? "(missing)"}`);
  process.exit(2);
}

if (
  process.env.NODE_ENV === "production" &&
  process.env.ALLOW_DESTRUCTIVE_PRODUCTION !== "true"
) {
  console.error(
    `Refusing to run ${action} with NODE_ENV=production. ` +
      "Set ALLOW_DESTRUCTIVE_PRODUCTION=true only after verifying the target database and backups.",
  );
  process.exit(1);
}
