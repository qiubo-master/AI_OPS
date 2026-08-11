import { listCourses, saveCourse } from "@/lib/db";
import type { Course } from "@/lib/course";

export const runtime = "nodejs";

export async function GET() {
  try {
    return Response.json({ courses: await listCourses() });
  } catch (error) {
    console.error("course list failure", error);
    return Response.json({ message: "数据库暂不可用" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const course = (await request.json()) as Course;
    if (!course.title?.trim() || !Array.isArray(course.slides)) {
      return Response.json({ message: "课程数据不完整" }, { status: 400 });
    }
    return Response.json({ course: await saveCourse(course) });
  } catch (error) {
    console.error("course save failure", error);
    return Response.json({ message: "保存失败" }, { status: 500 });
  }
}
