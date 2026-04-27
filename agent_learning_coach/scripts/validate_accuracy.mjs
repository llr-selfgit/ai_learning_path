import { existsSync, readFileSync } from "node:fs";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

const plan = readJson("curriculum/plan.json");
const sourceRegistry = readJson("sources/source_registry.json");
const claimsRegistry = readJson("sources/claims.json");

const sourcesById = new Map(sourceRegistry.sources.map((source) => [source.id, source]));
const claimsById = new Map(claimsRegistry.claims.map((claim) => [claim.id, claim]));
const errors = [];
const warnings = [];

function requireField(object, field, context) {
  if (object[field] === undefined || object[field] === null || object[field] === "") {
    errors.push(`${context} missing ${field}`);
  }
}

for (const source of sourceRegistry.sources) {
  for (const field of ["id", "title", "url", "tier", "type", "publisher", "checkedAt", "stability", "refreshAfter"]) {
    requireField(source, field, `source:${source.id || source.title || "unknown"}`);
  }
  if (!["A", "B", "C", "D"].includes(source.tier)) {
    errors.push(`source:${source.id} has invalid tier ${source.tier}`);
  }
}

for (const claim of claimsRegistry.claims) {
  for (const field of ["id", "statement", "confidence", "verifiedAt", "stability", "scope"]) {
    requireField(claim, field, `claim:${claim.id || "unknown"}`);
  }
  if (!Array.isArray(claim.sourceIds) || claim.sourceIds.length === 0) {
    errors.push(`claim:${claim.id} must have at least one sourceId`);
    continue;
  }
  const claimSources = claim.sourceIds.map((id) => sourcesById.get(id));
  claim.sourceIds.forEach((id) => {
    if (!sourcesById.has(id)) errors.push(`claim:${claim.id} references missing source:${id}`);
  });
  if (claimSources.length && claimSources.every((source) => source?.tier === "D")) {
    errors.push(`claim:${claim.id} is supported only by D-tier sources`);
  }
}

for (const lesson of plan.lessons) {
  for (const field of ["contentStatus", "stability"]) {
    requireField(lesson, field, `lesson:${lesson.id}`);
  }
  for (const field of ["lessonFile", "questionFile", "practiceTask"]) {
    requireField(lesson, field, `lesson:${lesson.id}`);
  }
  if (lesson.lessonFile && !existsSync(lesson.lessonFile)) {
    errors.push(`lesson:${lesson.id} lessonFile not found: ${lesson.lessonFile}`);
  }
  if (lesson.questionFile && !existsSync(lesson.questionFile)) {
    errors.push(`lesson:${lesson.id} questionFile not found: ${lesson.questionFile}`);
  }
  if (!lesson.practiceTask?.title || !lesson.practiceTask?.prompt || !lesson.practiceTask?.expectedEvidence) {
    errors.push(`lesson:${lesson.id} practiceTask must include title, prompt, expectedEvidence`);
  }
  if (!Array.isArray(lesson.sourceIds)) errors.push(`lesson:${lesson.id} sourceIds must be an array`);
  if (!Array.isArray(lesson.claimIds)) errors.push(`lesson:${lesson.id} claimIds must be an array`);

  for (const sourceId of lesson.sourceIds || []) {
    if (!sourcesById.has(sourceId)) errors.push(`lesson:${lesson.id} references missing source:${sourceId}`);
  }
  for (const claimId of lesson.claimIds || []) {
    if (!claimsById.has(claimId)) errors.push(`lesson:${lesson.id} references missing claim:${claimId}`);
  }

  if (lesson.contentStatus === "verified") {
    if (!lesson.verifiedAt) errors.push(`verified lesson:${lesson.id} missing verifiedAt`);
    if (!lesson.needsRefreshAfter) errors.push(`verified lesson:${lesson.id} missing needsRefreshAfter`);
    if (!lesson.sourceIds?.length) errors.push(`verified lesson:${lesson.id} needs sourceIds`);
    if (!lesson.claimIds?.length) errors.push(`verified lesson:${lesson.id} needs claimIds`);
    if (lesson.unverifiedNotes?.length) warnings.push(`verified lesson:${lesson.id} still has unverifiedNotes`);
  }

  if (lesson.questionFile && existsSync(lesson.questionFile)) {
    const questionSet = readJson(lesson.questionFile);
    if (!Array.isArray(questionSet.questions) || questionSet.questions.length < 2) {
      errors.push(`lesson:${lesson.id} must have at least 2 objective questions`);
    }
    for (const question of questionSet.questions || []) {
      if (!["single_choice", "multiple_choice"].includes(question.type)) {
        errors.push(`lesson:${lesson.id} question:${question.id} has unsupported type ${question.type}`);
      }
      if (!Array.isArray(question.options) || question.options.length < 2) {
        errors.push(`lesson:${lesson.id} question:${question.id} needs at least 2 options`);
      }
      if (!(question.options || []).some((option) => option.correct)) {
        errors.push(`lesson:${lesson.id} question:${question.id} needs at least one correct option`);
      }
      for (const option of question.options || []) {
        if (!option.explanation) {
          errors.push(`lesson:${lesson.id} question:${question.id} option:${option.id} missing explanation`);
        }
      }
    }
  }
}

if (warnings.length) {
  console.warn("Accuracy warnings:");
  warnings.forEach((warning) => console.warn(`- ${warning}`));
}

if (errors.length) {
  console.error("Accuracy validation failed:");
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Accuracy validation passed: ${plan.lessons.length} lessons, ${sourceRegistry.sources.length} sources, ${claimsRegistry.claims.length} claims.`);
