export type LearningPathModuleData = {
  title: string;
  description?: string;
  position?: number;
};

export type LearningPathVideoData = {
  title: string;
  videoId: string;
};

export type LearningPathCertificateData = {
  name: string;
  description?: string;
  templateUrl?: string;
};

export type LearningPathInstructorData = {
  name: string;
  bio?: string;
  avatarUrl?: string;
};

export type LearningPathFields = {
  title: string;
  description: string;
  modules: LearningPathModuleData[];
  categoryIds: string[];
  video: LearningPathVideoData;
  certificate: LearningPathCertificateData;
  instructor: LearningPathInstructorData;
};

export type CreateLearningPathData = Pick<LearningPathFields, "title"> &
  Partial<
    Pick<
      LearningPathFields,
      "description" | "modules" | "categoryIds" | "video" | "certificate"
    >
  > & {
    // Optional in the type so a test can leave it out (400 case).
    instructor?: LearningPathInstructorData;
  };
