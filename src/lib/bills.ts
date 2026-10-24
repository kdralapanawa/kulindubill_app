import { jsPDF } from "jspdf";

export type Bill = {
  id: string;
  bill_title: string;
  name: string;
  amount: number;
  bill_date: string;
  image_base64: string;
  created_at: string;
};

export const formatLKR = (n: number) =>
  "LKR " + Number(n).toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Read an image file, downscale it and return a JPEG Base64 data URL. */
export async function fileToBase64Jpeg(file: File, maxSize = 1000): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * scale);
  c.height = Math.round(img.height * scale);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.8);
}

function imageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const i = new Image();
    i.onload = () => resolve({ w: i.width, h: i.height });
    i.onerror = () => resolve({ w: 1, h: 1 });
    i.src = src;
  });
}

export async function downloadBillsPdf(bills: Bill[]) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = 210, pageH = 297, m = 15;
  const total = bills.reduce((s, b) => s + Number(b.amount), 0);
  let y = m;

  doc.setFont("helvetica", "bold").setFontSize(18).text("Bill Management Report", m, y + 4);
  y += 12;
  doc.setFont("helvetica", "normal").setFontSize(10);
  doc.text(`Report date: ${new Date().toLocaleString()}`, m, y);
  doc.text(`Total bills: ${bills.length}`, m, y + 5);
  doc.text(`Total amount: ${formatLKR(total)}`, m, y + 10);
  y += 16;
  doc.setDrawColor(180).line(m, y, pageW - m, y);
  y += 6;

  for (let idx = 0; idx < bills.length; idx++) {
    const b = bills[idx]!;
    const { w, h } = await imageSize(b.image_base64);
    const imgW = 50;
    const imgH = Math.min(70, (h / w) * imgW);
    const blockH = Math.max(imgH, 30) + 8;
    if (y + blockH > pageH - m) {
      doc.addPage();
      y = m;
    }
    doc.setFont("helvetica", "bold").setFontSize(12).text(`${idx + 1}. ${b.bill_title}`, m, y + 4, { maxWidth: 120 });
    doc.setFont("helvetica", "normal").setFontSize(10);
    doc.text(`Name: ${b.name}`, m, y + 12);
    doc.text(`Amount: ${formatLKR(b.amount)}`, m, y + 18);
    doc.text(`Date: ${b.bill_date}`, m, y + 24);
    try {
      const fmt = b.image_base64.startsWith("data:image/png") ? "PNG" : "JPEG";
      doc.addImage(b.image_base64, fmt, pageW - m - imgW, y, imgW, imgH);
    } catch {
      doc.text("(image unavailable)", pageW - m - imgW, y + 10);
    }
    y += blockH;
    doc.setDrawColor(220).line(m, y - 3, pageW - m, y - 3);
  }

  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(8).setTextColor(120).text(`Page ${p} of ${pages}`, pageW - m, pageH - 8, { align: "right" });
    doc.setTextColor(0);
  }
  doc.save(`bills-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
