import { buildSourceMeta } from "@/lib/security/immutableReligiousText";
import { LONG_CACHE_SECONDS } from "@/lib/http/cache";

const HADEETHENC_BASE_URL = process.env.HADEETHENC_BASE_URL || "https://hadeethenc.com/api/v1";

async function fetchWithTimeout(url: string, init: RequestInit = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const FALLBACK_CATEGORIES = [
  { id: 1, title: "أحاديث جامعة", hadeeths_count: 4, children_count: 0 },
  { id: 2, title: "الأذكار والفضائل", hadeeths_count: 3, children_count: 0 },
  { id: 3, title: "الأخلاق والآداب", hadeeths_count: 3, children_count: 0 }
];

const FALLBACK_HADITHS: Record<number, Array<{ id: number; title: string; hadeeth: string; attribution: string; grade: string; explanation: string }>> = {
  1: [
    {
      id: 1001,
      title: "إنما الأعمال بالنيات",
      hadeeth: "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى.",
      attribution: "متفق عليه",
      grade: "صحيح",
      explanation: "يبين الحديث أن قبول العمل وثوابه مرتبط بالنية، وأن صلاح القلب أساس صلاح العمل."
    },
    {
      id: 1002,
      title: "الدين النصيحة",
      hadeeth: "الدين النصيحة.",
      attribution: "رواه مسلم",
      grade: "صحيح",
      explanation: "يدل الحديث على عظم شأن النصيحة، وأنها من أصول الدين في علاقة المسلم بربه وكتابه ورسوله والمسلمين."
    },
    {
      id: 1003,
      title: "من كان يؤمن بالله واليوم الآخر",
      hadeeth: "من كان يؤمن بالله واليوم الآخر فليقل خيرًا أو ليصمت.",
      attribution: "متفق عليه",
      grade: "صحيح",
      explanation: "يرشد الحديث إلى حفظ اللسان، وأن الكلام ينبغي أن يكون خيرًا أو يتركه الإنسان سلامة لدينه."
    },
    {
      id: 1004,
      title: "لا يؤمن أحدكم حتى يحب لأخيه",
      hadeeth: "لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه.",
      attribution: "متفق عليه",
      grade: "صحيح",
      explanation: "يبين الحديث كمال الإيمان بحب الخير للمسلمين وترك الحسد والأنانية."
    }
  ],
  2: [
    {
      id: 2001,
      title: "كلمتان خفيفتان على اللسان",
      hadeeth: "كلمتان خفيفتان على اللسان، ثقيلتان في الميزان، حبيبتان إلى الرحمن: سبحان الله وبحمده، سبحان الله العظيم.",
      attribution: "متفق عليه",
      grade: "صحيح",
      explanation: "فيه فضل الذكر وأن الكلمات اليسيرة قد يكون لها أجر عظيم عند الله تعالى."
    },
    {
      id: 2002,
      title: "أحب الكلام إلى الله",
      hadeeth: "أحب الكلام إلى الله: سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر.",
      attribution: "رواه مسلم",
      grade: "صحيح",
      explanation: "يدل الحديث على فضل هذه الأذكار الجامعة لمعاني التنزيه والحمد والتوحيد والتكبير."
    },
    {
      id: 2003,
      title: "من قال سبحان الله وبحمده",
      hadeeth: "من قال: سبحان الله وبحمده في يوم مائة مرة، حطت خطاياه وإن كانت مثل زبد البحر.",
      attribution: "متفق عليه",
      grade: "صحيح",
      explanation: "يبين الحديث فضل التسبيح والمداومة عليه، وأن الذكر سبب لمغفرة الذنوب."
    }
  ],
  3: [
    {
      id: 3001,
      title: "تبسمك في وجه أخيك صدقة",
      hadeeth: "تبسمك في وجه أخيك لك صدقة.",
      attribution: "رواه الترمذي",
      grade: "حسن",
      explanation: "يدعو الحديث إلى حسن الخلق وبذل المعروف ولو بأمر يسير كالبشاشة والابتسامة."
    },
    {
      id: 3002,
      title: "خيركم خيركم لأهله",
      hadeeth: "خيركم خيركم لأهله، وأنا خيركم لأهلي.",
      attribution: "رواه الترمذي",
      grade: "صحيح بمجموع طرقه عند عدد من أهل العلم",
      explanation: "يدل الحديث على أن حسن التعامل مع الأهل من أعظم دلائل الخيرية وحسن الخلق."
    },
    {
      id: 3003,
      title: "المسلم من سلم المسلمون",
      hadeeth: "المسلم من سلم المسلمون من لسانه ويده.",
      attribution: "متفق عليه",
      grade: "صحيح",
      explanation: "فيه بيان أن من كمال إسلام المرء أن يأمن الناس أذاه قولًا وفعلًا."
    }
  ]
};

function fallbackMeta(path: string) {
  return buildSourceMeta("مصدر أحاديث محلي احتياطي داخل رِفْق", `local://fallback-hadith${path}`);
}

function allFallbackHadiths() {
  return Object.values(FALLBACK_HADITHS).flat();
}

async function fetchHadeethEnc<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${HADEETHENC_BASE_URL}${path}`, {
    headers: {
      accept: "application/json",
      "user-agent": "rifq-islamic-web-app/1.0"
    },
    cache: "force-cache",
    next: { revalidate: LONG_CACHE_SECONDS }
  });

  if (!res.ok) {
    throw new Error(`HadeethEnc request failed: ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export type HadeethCategory = {
  id: number;
  title: string;
  hadeeths_count?: number;
  children_count?: number;
};

export async function getHadeethCategories(language = "ar") {
  const safeLanguage = encodeURIComponent(language || "ar");
  const path = `/categories/roots/?language=${safeLanguage}`;

  try {
    const data = await fetchHadeethEnc<HadeethCategory[]>(path);
    return {
      data,
      meta: buildSourceMeta("HadeethEnc API", `${HADEETHENC_BASE_URL}${path}`)
    };
  } catch {
    return {
      data: FALLBACK_CATEGORIES,
      meta: fallbackMeta("/categories")
    };
  }
}

export async function getHadeethsByCategory(params: {
  categoryId: number;
  page?: number;
  perPage?: number;
  language?: string;
}) {
  const categoryId = params.categoryId;
  const page = params.page || 1;
  const perPage = params.perPage || 20;
  const language = encodeURIComponent(params.language || "ar");

  if (!Number.isInteger(categoryId) || categoryId < 1) {
    throw new Error("Invalid HadeethEnc category id.");
  }

  const path = `/hadeeths/list/?language=${language}&category_id=${categoryId}&page=${page}&per_page=${perPage}`;

  try {
    const data = await fetchHadeethEnc<unknown>(path);
    return {
      data,
      meta: buildSourceMeta("HadeethEnc API", `${HADEETHENC_BASE_URL}${path}`)
    };
  } catch {
    const sourceItems = FALLBACK_HADITHS[categoryId] || allFallbackHadiths();
    const start = (page - 1) * perPage;
    const items = sourceItems.slice(start, start + perPage).map((item) => ({
      id: item.id,
      hadeeth_id: item.id,
      title: item.title,
      hadeeth_title: item.title
    }));

    return {
      data: {
        data: items,
        current_page: page,
        per_page: perPage,
        total: sourceItems.length
      },
      meta: fallbackMeta(`/category/${categoryId}`)
    };
  }
}

export async function getHadeethById(params: { id: number; language?: string }) {
  const id = params.id;
  const language = encodeURIComponent(params.language || "ar");

  if (!Number.isInteger(id) || id < 1) {
    throw new Error("Invalid HadeethEnc hadith id.");
  }

  const path = `/hadeeths/one/?language=${language}&id=${id}`;

  try {
    const data = await fetchHadeethEnc<unknown>(path);
    return {
      data,
      meta: buildSourceMeta("HadeethEnc API", `${HADEETHENC_BASE_URL}${path}`)
    };
  } catch {
    const item = allFallbackHadiths().find((hadith) => hadith.id === id) || allFallbackHadiths()[0];
    return {
      data: item,
      meta: fallbackMeta(`/hadith/${id}`)
    };
  }
}
