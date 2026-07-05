"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Transaction, TransactionStatus } from "@/lib/types/admin";

interface Props {
  transactions: Transaction[];
}

function getStatusBadge(status: TransactionStatus) {
  switch (status) {
    case "paid":
      return <Badge variant="secondary" className="bg-green-100 text-green-800">지불됨</Badge>;
    case "failed":
      return <Badge variant="destructive">실패</Badge>;
    case "pending":
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">대기</Badge>;
    case "refunded":
      return <Badge variant="secondary" className="bg-red-100 text-red-800">환불</Badge>;
    case "chargeback":
      return <Badge variant="destructive" className="bg-red-800">차지백</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function formatDate(dateString: string | null) {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours().toString().padStart(2, "0");
  const minute = date.getMinutes().toString().padStart(2, "0");
  return `${year}. ${month}. ${day}. ${hour}:${minute}`;
}

function formatCurrency(amount: number, currency: string) {
  const value = (amount / 100).toFixed(2);
  const symbol = currency === "USD" ? "$" : currency === "KRW" ? "₩" : currency;
  return `${symbol}${value}`;
}

export function TransactionsTable({ transactions }: Props) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        아직 결제 기록이 없습니다. Creem 동기화를 실행해주세요.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order ID</TableHead>
            <TableHead>유형</TableHead>
            <TableHead>금액</TableHead>
            <TableHead>상태</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>환불</TableHead>
            <TableHead>결제일</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => (
            <TableRow key={tx.id}>
              <TableCell>
                <span className="text-xs font-mono text-muted-foreground">
                  {tx.creem_order_id || "-"}
                </span>
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {tx.type === "payment" ? "결제" : "인보이스"}
                </Badge>
              </TableCell>
              <TableCell>
                {formatCurrency(tx.amount, tx.currency)}
              </TableCell>
              <TableCell>
                {getStatusBadge(tx.status)}
              </TableCell>
              <TableCell>
                <span className="font-medium">
                  {tx.user_email || "-"}
                </span>
              </TableCell>
              <TableCell>
                {tx.refunded_amount > 0 ? (
                  <Badge variant="outline" className="bg-white border-red-300 text-red-600">
                    {formatCurrency(tx.refunded_amount, tx.currency)}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                {formatDate(tx.creem_created_at)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
