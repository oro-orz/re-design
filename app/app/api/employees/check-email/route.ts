/**
 * 社員メールアドレス検証API
 * POST /api/employees/check-email
 */

import { NextRequest, NextResponse } from "next/server";
import { getBigQueryClient } from "@/lib/bigquery";

const isDevelopment = process.env.NODE_ENV === "development";

interface CheckEmailRequest {
  email: string;
}

interface EmployeeRow {
  employee_number: string;
  name: string;
  location: string;
  department: string;
  role: string;
  tmg_email: string;
  google_email: string;
  chatwork_id: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckEmailRequest = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { error: "email is required", exists: false },
        { status: 400 }
      );
    }

    const email = body.email.toLowerCase().trim();

    const query = `
      SELECT
        employee_number,
        name,
        location,
        department,
        role,
        tmg_email,
        google_email,
        chatwork_id
      FROM \`hoshino-system-447006.tmg_portal.employees\`
      WHERE LOWER(google_email) = @email
      LIMIT 1
    `;

    const options = {
      query,
      params: { email },
    };

    const bigquery = getBigQueryClient();
    const [rows] = await bigquery.query(options);

    if (rows.length === 0) {
      return NextResponse.json({
        exists: false,
        message: "Employee not found",
        checkedEmail: email,
      });
    }

    const employee = rows[0] as EmployeeRow;

    const allowedRoles = ["役員", "M", "PM"];
    const isSystemDept = employee.department === "システム課";
    const hasAllowedRole = allowedRoles.includes(employee.role);
    const hasPermission = isSystemDept || hasAllowedRole;

    if (!hasPermission) {
      const detailMessage = isDevelopment
        ? `権限不足: department="${employee.department}", role="${employee.role}"`
        : "このダッシュボードへのアクセス権限がありません";

      return NextResponse.json({
        exists: true,
        authorized: false,
        message: detailMessage,
      });
    }

    return NextResponse.json({
      exists: true,
      authorized: true,
      employee: {
        employee_number: employee.employee_number,
        name: employee.name,
        location: employee.location,
        department: employee.department,
        role: employee.role,
        tmg_email: employee.tmg_email,
        google_email: employee.google_email,
        chatwork_id: employee.chatwork_id,
      },
    });
  } catch (error) {
    console.error("Employee check error:", error);

    return NextResponse.json(
      {
        error: "Internal server error",
        exists: false,
      },
      { status: 500 }
    );
  }
}
