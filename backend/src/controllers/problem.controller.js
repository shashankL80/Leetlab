import { db } from "../libs/db.js";
import {
  getJudge0LanguageId,
  pollBatchResults,
  submitBatch,
} from "../libs/judge0.lib.js";
import AppError from "../utils/appError.js";
import sendResponse from "../utils/sendResponse.js";

export const createProblem = async (req, res, next) => {
  // GET DATA FROM REQ BODY
  const {
    title,
    description,
    difficuilty,
    tags,
    examples,
    constraints,
    hints,
    editorial,
    testcases,
    codeSnippets,
    referenceSolutions,
  } = req.body;

  // CHECK USER ROLE AGAIN - ONLY ADMIN CAN CREATE PROBLEM
  if (req.user.role !== "ADMIN") {
    return next(
      new AppError("You are not authorized to create a problem", 403)
    );
  }

  // LOOP THROUGH REFERENCE SOLUTION FOR EACH LANGUAGE
  try {
    for (const [language, solutionCode] of Object.entries(referenceSolutions)) {
      const languageId = getJudge0LanguageId(language);

      if (!languageId) {
        return next(new AppError("Language not supported", 400));
      }

      const submissions = testcases?.map(({ input, output }) => ({
        source_code: solutionCode,
        language_id: languageId,
        stdin: input,
        expected_output: output,
      }));

      const submissionResults = await submitBatch(submissions);

      const tokens = submissionResults?.map((t) => t.token);

      const results = await pollBatchResults(tokens);

      for (let i = 0; i < results.length; i++) {
        const res = results[i];

        if (res.status_id !== 3) {
          return next(
            new AppError(`Testcase ${i + 1} failed for language ${language}`)
          );
        }
      }

      const newProblem = await db.problem.create({
        data: {
          title,
          description,
          difficuilty,
          tags,
          examples,
          constraints,
          hints,
          editorial,
          testcases,
          codeSnippets,
          referenceSolutions,
          userId: req.user.id,
        },
      });

      sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Problem created successfully",
        data: {
          newProblem,
        },
      });
    }
  } catch (error) {
    console.log("Error in creating problem ", error);
    return next(new AppError("Error creating problem", 500));
  }
};

export const getAllProblems = async (req, res, next) => {
  try {
    const allProblems = await db.problem.findMany();

    if (!allProblems) {
      return next(new AppError("Error fetching all problems", 400));
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "All problems fetched successfully",
      data: {
        allProblems,
      },
    });
  } catch (error) {
    console.log("Error fetching all problems", error);
    return next(new AppError("Error fetching problem", 500));
  }
};

export const getProblemById = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("Invalid problem ID", 400));
  }

  try {
    const problem = await db.problem.findUnique({
      where: {
        id,
      },
    });

    if (!problem) {
      return next(new AppError("Problem not found", 404));
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Problem fetched successfully",
      data: {
        problem,
      },
    });
  } catch (error) {
    console.log("Error fetching problem", error);
    return next(new AppError("Error fetching problem", 500));
  }
};

export const updateProblem = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("Invalid problem ID", 400));
  }

  try {
    const problem = await db.problem.findUnique({
      where: {
        id,
      },
    });

    if (!problem) {
      return next(new AppError("Problem not found", 404));
    }
  } catch (error) {
    console.log("Error updating problem ", error);
    return next(new AppError("Error updating problem", 500));
  }
};

export const deleteProblem = async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(new AppError("Invalid problem ID", 400));
  }

  try {
    const deleteProblem = await db.problem.delete({
      where: { id },
    });

    if (!deleteProblem) {
      return next(new AppError("Error deleting problem", 400));
    }

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Problem deleted successfully",
    });
  } catch (error) {
    console.log("Error deleting problem ", error);
    return next(new AppError("Error deleting problem", 500));
  }
};

export const getAllProblemsSolvedByUser = async (req, res, next) => {};
