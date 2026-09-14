import { adminDb } from "./_core/firebaseAdmin";
import type { InsertUser, User } from "../drizzle/schema";

const hasRealCredentials = Boolean(
  process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
);

// Local in-memory state so local dev mode without service account keys works instantly
const mockDb = {
  users: new Map<string, any>(),
  profiles: new Map<string, any>(),
  competencies: new Map<string, any[]>(),
  events: new Map<string, any[]>(),
  evidence: new Map<string, any[]>(),
  materials: new Map<string, any[]>(),
  questions: new Map<string, any[]>(),
};

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const now = new Date();
  const userObj = { ...user, id: 1, createdAt: now, lastSignedIn: now };
  mockDb.users.set(user.openId, userObj);

  if (hasRealCredentials) {
    try {
      const userRef = adminDb.collection("users").doc(user.openId);
      const doc = await userRef.get();
      const updateData: Record<string, any> = {
        openId: user.openId,
        updatedAt: now,
        lastSignedIn: user.lastSignedIn || now,
      };

      if (user.name !== undefined) updateData.name = user.name;
      if (user.email !== undefined) updateData.email = user.email;
      if (user.loginMethod !== undefined) updateData.loginMethod = user.loginMethod;
      if (user.role !== undefined) updateData.role = user.role;

      if (!doc.exists) {
        updateData.id = 1;
        updateData.role = user.role || "user";
        updateData.createdAt = now;
        await userRef.set(updateData);
      } else {
        await userRef.update(updateData);
      }
    } catch (error) {
      console.warn("[Firestore] upsertUser fallback used:", (error as Error).message);
    }
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  if (!hasRealCredentials) return mockDb.users.get(openId);
  try {
    const userRef = adminDb.collection("users").doc(openId);
    const doc = await userRef.get();
    if (!doc.exists) return mockDb.users.get(openId);
    const data = doc.data() as any;
    return {
      id: data.id || 1,
      openId: data.openId || openId,
      name: data.name || null,
      email: data.email || null,
      loginMethod: data.loginMethod || "firebase",
      role: data.role || "user",
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
      lastSignedIn: data.lastSignedIn?.toDate ? data.lastSignedIn.toDate() : new Date(),
    };
  } catch (error) {
    console.warn("[Firestore] getUserByOpenId fallback used:", (error as Error).message);
    return mockDb.users.get(openId);
  }
}

export async function getProfile(userId: number | string): Promise<any> {
  if (!hasRealCredentials) return mockDb.profiles.get(String(userId)) ?? undefined;
  try {
    const snapshot = await adminDb
      .collection("learnerProfiles")
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (snapshot.empty) return mockDb.profiles.get(String(userId)) ?? undefined;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.warn("[Firestore] getProfile fallback used:", (error as Error).message);
    return mockDb.profiles.get(String(userId)) ?? undefined;
  }
}

export async function getWorkspace(userId: number | string): Promise<any> {
  const profile = await getProfile(userId);
  const localComp = mockDb.competencies.get(String(userId)) || [];
  const localEvents = mockDb.events.get(String(userId)) || [];
  const localEvidence = mockDb.evidence.get(String(userId)) || [];
  const localMaterials = mockDb.materials.get(String(userId)) || [];

  if (!hasRealCredentials) {
    return {
      profile,
      competencies: localComp,
      events: localEvents,
      evidence: localEvidence,
      materials: localMaterials,
    };
  }

  try {
    const [compSnap, eventSnap, evSnap, matSnap] = await Promise.all([
      adminDb.collection("competencyStates").where("userId", "==", userId).get(),
      adminDb.collection("learningEvents").where("userId", "==", userId).limit(12).get(),
      adminDb.collection("evidence").where("userId", "==", userId).limit(12).get(),
      adminDb.collection("studyMaterials").where("userId", "==", userId).limit(8).get(),
    ]);

    const competencies = compSnap.docs.length ? compSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) : localComp;
    const events = eventSnap.docs.length ? eventSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) : localEvents;
    const evidenceRows = evSnap.docs.length ? evSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) : localEvidence;
    const materials = matSnap.docs.length ? matSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) : localMaterials;

    return {
      profile,
      competencies,
      events,
      evidence: evidenceRows,
      materials,
    };
  } catch (error) {
    console.warn("[Firestore] getWorkspace fallback used:", (error as Error).message);
    return {
      profile,
      competencies: localComp,
      events: localEvents,
      evidence: localEvidence,
      materials: localMaterials,
    };
  }
}

export async function getQuestionHistory(userId: number | string) {
  const localQ = mockDb.questions.get(String(userId)) || [];
  if (!hasRealCredentials) return localQ;
  try {
    const snapshot = await adminDb
      .collection("quizQuestions")
      .where("userId", "==", userId)
      .limit(100)
      .get();

    return snapshot.docs.length ? snapshot.docs.map((doc: any) => ({ id: doc.id, ...(doc.data() as any) })) : localQ;
  } catch (error) {
    console.warn("[Firestore] getQuestionHistory fallback used:", (error as Error).message);
    return localQ;
  }
}

export async function saveProfile(userId: number | string, values: any) {
  const profileObj = { ...values, userId, id: "p1", createdAt: new Date(), updatedAt: new Date() };
  mockDb.profiles.set(String(userId), profileObj);

  if (hasRealCredentials) {
    try {
      const existing = await getProfile(userId);
      const now = new Date();
      if (existing && existing.id && existing.id !== "p1") {
        await adminDb.collection("learnerProfiles").doc(String(existing.id)).update({
          ...values,
          updatedAt: now,
        });
      } else {
        await adminDb.collection("learnerProfiles").add({
          ...values,
          userId,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (error) {
      console.warn("[Firestore] saveProfile fallback used:", (error as Error).message);
    }
  }
}

export async function saveInitialCompetencyStates(userId: number | string, states: any[]) {
  const comps = states.map(s => ({ userId, ...s }));
  mockDb.competencies.set(String(userId), comps);

  if (hasRealCredentials) {
    try {
      const batch = adminDb.batch();
      for (const compState of states) {
        const docRef = adminDb.collection("competencyStates").doc();
        batch.set(docRef, { userId, ...compState });
      }
      await batch.commit();
    } catch (error) {
      console.warn("[Firestore] saveInitialCompetencyStates fallback used:", (error as Error).message);
    }
  }
}

export async function submitAssessment(userId: number | string, scores: Record<string, number>) {
  const existing = mockDb.competencies.get(String(userId)) || [];
  const updated = existing.map(item => {
    if (scores[item.competencyId] !== undefined) {
      const rounded = Math.round(scores[item.competencyId]);
      return {
        ...item,
        currentScore: rounded,
        status: rounded >= 75 ? "MASTERED" : rounded >= 55 ? "IN PROGRESS" : "NEEDS PRACTICE",
      };
    }
    return item;
  });
  mockDb.competencies.set(String(userId), updated);

  const values = Object.values(scores);
  const average = Math.round(values.reduce((sum, value) => sum + value, 0) / Math.max(values.length, 1));

  if (hasRealCredentials) {
    try {
      const snapshot = await adminDb.collection("competencyStates").where("userId", "==", userId).get();
      for (const [competencyId, score] of Object.entries(scores)) {
        const match = snapshot.docs.find((d: any) => d.data().competencyId === competencyId);
        const roundedScore = Math.round(score);
        const status = roundedScore >= 75 ? "MASTERED" : roundedScore >= 55 ? "IN PROGRESS" : "NEEDS PRACTICE";
        if (match) {
          await match.ref.update({ currentScore: roundedScore, status });
        }
      }
      await adminDb.collection("assessmentAttempts").add({
        userId,
        assessmentType: "initial",
        score: average,
        answersJson: JSON.stringify(scores),
        createdAt: new Date(),
      });
    } catch (error) {
      console.warn("[Firestore] submitAssessment fallback used:", (error as Error).message);
    }
  }

  return { average, updated };
}

export async function recordLearningEvent(userId: number | string, event: any) {
  const list = mockDb.events.get(String(userId)) || [];
  list.push({ userId, ...event });
  mockDb.events.set(String(userId), list);

  if (hasRealCredentials) {
    try {
      await adminDb.collection("learningEvents").add({
        userId,
        ...event,
        createdAt: new Date(),
      });
    } catch (error) {
      console.warn("[Firestore] recordLearningEvent fallback used:", (error as Error).message);
    }
  }
  return { success: true };
}

export async function recordStudyMaterialAndQuestions(userId: number | string, materialName: string, topic: string, questions: any[]) {
  const matList = mockDb.materials.get(String(userId)) || [];
  matList.push({ userId, fileName: materialName, mimeType: "application/pdf" });
  mockDb.materials.set(String(userId), matList);

  const qList = mockDb.questions.get(String(userId)) || [];
  for (const q of questions) {
    qList.push({ userId, competencyId: topic, questionText: q.question });
  }
  mockDb.questions.set(String(userId), qList);

  if (hasRealCredentials) {
    try {
      await adminDb.collection("studyMaterials").add({
        userId,
        fileName: materialName,
        mimeType: "application/pdf",
        textSnippet: `AI-assisted extraction for ${topic}`,
        createdAt: new Date(),
      });

      if (questions.length) {
        const batch = adminDb.batch();
        for (const question of questions) {
          const docRef = adminDb.collection("quizQuestions").doc();
          batch.set(docRef, {
            userId,
            competencyId: topic,
            questionText: question.question,
            createdAt: new Date(),
          });
        }
        await batch.commit();
      }
    } catch (error) {
      console.warn("[Firestore] recordStudyMaterialAndQuestions fallback used:", (error as Error).message);
    }
  }
}

export async function submitMissionEvidence(userId: number | string, missionId: string, score: number, summary: string) {
  const targets = ["python-fundamentals", "data-processing", "data-quality", "data-visualization"];
  const list = mockDb.evidence.get(String(userId)) || [];
  for (const competencyId of targets) {
    list.push({ userId, competencyId, evidenceType: "practical mission", score, summary });
  }
  mockDb.evidence.set(String(userId), list);

  const existingComp = mockDb.competencies.get(String(userId)) || [];
  const updatedComp = existingComp.map(state => {
    if (targets.includes(state.competencyId)) {
      const nextScore = Math.min(100, Math.round(state.currentScore + (score - state.currentScore) * 0.35 + 5));
      const status = nextScore >= 75 ? "MASTERED" : nextScore >= 55 ? "IN PROGRESS" : "NEEDS PRACTICE";
      return { ...state, currentScore: nextScore, status, evidenceCount: (state.evidenceCount || 0) + 1 };
    }
    return state;
  });
  mockDb.competencies.set(String(userId), updatedComp);

  if (hasRealCredentials) {
    try {
      const snapshot = await adminDb.collection("competencyStates").where("userId", "==", userId).get();
      for (const competencyId of targets) {
        const match = snapshot.docs.find((d: any) => d.data().competencyId === competencyId);
        if (!match) continue;
        const state = match.data();
        const nextScore = Math.min(100, Math.round(state.currentScore + (score - state.currentScore) * 0.35 + 5));
        const status = nextScore >= 75 ? "MASTERED" : nextScore >= 55 ? "IN PROGRESS" : "NEEDS PRACTICE";
        const evidenceCount = (state.evidenceCount || 0) + 1;

        await match.ref.update({ currentScore: nextScore, status, evidenceCount });
        await adminDb.collection("evidence").add({
          userId,
          competencyId,
          evidenceType: "practical mission",
          score,
          summary,
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.warn("[Firestore] submitMissionEvidence fallback used:", (error as Error).message);
    }
  }

  return { updated: updatedComp };
}

// Compatibility exports
export const assessmentAttempts = {};
export const competencyStates = {};
export const evidence = {};
export const learnerProfiles = {};
export const learningEvents = {};
export const quizQuestions = {};
export const studyMaterials = {};
export const users = {};

export async function getDb() {
  return adminDb;
}
