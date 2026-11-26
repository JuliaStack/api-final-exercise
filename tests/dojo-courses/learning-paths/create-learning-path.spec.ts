import {
  learningPathSchema,
  type LearningPath,
} from "../../app/json-schemas/learning-path";
import {
  invalidLearningPathData,
  unauthorizedCreateLearningPathCallers,
} from "../../app/test-data/invalid-learning-path-data";
import {
  buildLearningPathCertificateData,
  buildLearningPathData,
  buildLearningPathModuleData,
  buildLearningPathVideoData,
} from "../../app/test-data/learning-path-data";
import { expect, test } from "../../fixtures";

test.describe("create learning path", () => {
  test(
    "API-168: admin creating a learning path with modules, a category, a video, a certificate and an instructor - should return 201 and the learning path",
    { tag: ["@regression", "@smoke"] },
    async ({
      apiClient,
      videoIdsToDelete,
      createdCategory,
      adminToken,
    }) => {
      const data = buildLearningPathData({
        modules: [
          buildLearningPathModuleData({ position: 1 }),
          buildLearningPathModuleData({ position: 2 }),
        ],
        categoryIds: [createdCategory.id],
        video: buildLearningPathVideoData(),
        certificate: buildLearningPathCertificateData(),
      });

      const response = await test.step("admin creates a learning path", () =>
        apiClient.learningPaths.createLearningPath(adminToken, data));

      const json: LearningPath = await response.json();
      // eslint-disable-next-line playwright/no-conditional-in-test -- push only when the response has a video
      if (json.video) videoIdsToDelete.push(json.video.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("response body matches the learning path schema", () => {
        const result = learningPathSchema.safeParse(json);
        expect(result.error?.issues ?? []).toEqual([]);
      });

      await test.step("learning path fields are built from the sent data", () => {
        const modules = [...json.modules].sort(
          (a, b) => a.position - b.position,
        );
        expect({ ...json, modules }).toMatchObject({
          title: data.title,
          description: data.description,
          slug: data.title.toLowerCase().replace(/\s+/g, "-"),
          isPublished: false,
          videoId: json.video?.id,
          instructorId: json.instructor.id,
          modules: data.modules?.map((module) => ({
            ...module,
            learningPathId: json.id,
          })),
          categories: [createdCategory],
          video: data.video,
          certificate: { ...data.certificate, learningPathId: json.id },
          instructor: data.instructor,
        });
      });
    },
  );

  test(
    "API-169: admin creating a learning path with empty video and certificate objects - should return 201 without a video and a certificate",
    { tag: "@regression" },
    async ({ apiClient, videoIdsToDelete, adminToken }) => {
      const instructor = { name: "Instructor Name" };
      const data = buildLearningPathData({
        description: undefined,
        instructor,
        video: buildLearningPathVideoData({ title: "", videoId: "" }),
        certificate: buildLearningPathCertificateData({
          name: "",
          description: "",
          templateUrl: "",
        }),
      });

      const response = await test.step("admin creates a learning path", () =>
        apiClient.learningPaths.createLearningPath(adminToken, data));

      const json: LearningPath = await response.json();
      // eslint-disable-next-line playwright/no-conditional-in-test -- push only when the response has a video
      if (json.video) videoIdsToDelete.push(json.video.id);

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("learning path has no optional parts", () => {
        expect(json).toMatchObject({
          title: data.title,
          description: null,
          isPublished: false,
          videoId: null,
          modules: [],
          categories: [],
          video: null,
          certificate: null,
          instructor: { ...instructor, bio: null, avatarUrl: null },
        });
      });
    },
  );

  test(
    "API-170: admin creating a learning path with modules without position - should return 201 with positions in the sent order",
    { tag: "@regression" },
    async ({ apiClient, adminToken }) => {
      const modules = [
        buildLearningPathModuleData(),
        buildLearningPathModuleData(),
        buildLearningPathModuleData(),
      ];
      const data = buildLearningPathData({ modules });

      const response = await test.step("admin creates a learning path", () =>
        apiClient.learningPaths.createLearningPath(adminToken, data));

      const json: LearningPath = await response.json();

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("modules get positions 0, 1, 2 in the sent order", () => {
        const sortedModules = [...json.modules].sort(
          (a, b) => a.position - b.position,
        );
        expect(sortedModules).toMatchObject(
          modules.map(({ title }, index) => ({ title, position: index })),
        );
      });
    },
  );

  test(
    "API-171: admin creating a learning path with an existing title - should return 201 with a different slug",
    { tag: "@regression" },
    async ({ apiClient, adminToken }) => {
      const firstData = buildLearningPathData();
      const firstResponse =
        await test.step("precondition: admin creates a learning path", () =>
          apiClient.learningPaths.createLearningPath(adminToken, firstData));
      const firstPath: LearningPath = await firstResponse.json();

      const data = buildLearningPathData({ title: firstPath.title });

      const response =
        await test.step("admin creates a learning path with the same title", () =>
          apiClient.learningPaths.createLearningPath(adminToken, data));

      const json: LearningPath = await response.json();

      await test.step("status code matches 201", () => {
        expect(response.status()).toBe(201);
      });

      await test.step("new learning path has the same title and its own id", () => {
        expect(json.title).toBe(firstPath.title);
        expect(json.id).not.toBe(firstPath.id);
      });

      await test.step("slug of the new learning path is made unique", () => {
        expect(json.slug).toMatch(new RegExp(`^${firstPath.slug}-\\d+$`));
      });
    },
  );
});

test.describe("create learning path - negative scenarios", () => {
  for (const {
    id,
    title,
    caller,
    status,
    error,
  } of unauthorizedCreateLearningPathCallers) {
    test(
      `${id}: ${title} creating a learning path - should return ${status}`,
      { tag: "@regression" },
      async ({
        rawApiClient,
        apiClient,
        videoIdsToDelete,
        tokenFor,
      }) => {
        const token = await tokenFor(caller);

        const video = buildLearningPathVideoData();
        const data = buildLearningPathData({ video });

        const response =
          await test.step(`${title} creates a learning path`, () =>
            rawApiClient.learningPaths.createLearningPath(token, data));

        const json = await response.json();
        // eslint-disable-next-line playwright/no-conditional-in-test -- push only when the response has a video
        if (json.video) videoIdsToDelete.push(json.video.id);

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });

        const listResponse =
          await test.step("anonymous user requests the video list", () =>
            apiClient.youtubeVideos.getVideos());

        const list: { title: string }[] = await listResponse.json();

        await test.step("video of the learning path is not created", () => {
          expect(list.map(({ title }) => title)).not.toContain(video.title);
        });
      },
    );
  }

  for (const {
    id,
    title,
    buildPayload,
    status,
    error,
  } of invalidLearningPathData) {
    test(
      `${id}: ${title} - should return ${status}`,
      { tag: "@regression" },
      async ({ rawApiClient, adminToken }) => {
        const payload = buildPayload();

        const response =
          await test.step(`admin creates a learning path with ${title}`, () =>
            rawApiClient.learningPaths.createLearningPath(adminToken, payload));

        await test.step(`status code matches ${status}`, () => {
          expect(response.status()).toBe(status);
        });

        const json = await response.json();
        await test.step("response contains an error", () => {
          expect(json.error).toContain(error);
        });
      },
    );
  }

  test.fail(
    "API-177: admin creating a learning path with an empty category id - should return 4xx",
    {
      tag: "@regression",
      annotation: {
        type: "known bug",
        description:
          "the route passes categoryIds straight to prisma connect without a lookup and returns 500 for an unknown category id",
      },
    },
    async ({ rawApiClient, adminToken }) => {
      const data = buildLearningPathData({ categoryIds: [""] });

      const response =
        await test.step("admin creates a learning path with an empty category id", () =>
          rawApiClient.learningPaths.createLearningPath(adminToken, data));

      await test.step("status code is 4xx", () => {
        expect(response.status()).toBeGreaterThanOrEqual(400);
        expect(response.status()).toBeLessThan(500);
      });

      const json = await response.json();
      await test.step("response contains an error", () => {
        expect(json.error).toBeTruthy();
      });
    },
  );
});
