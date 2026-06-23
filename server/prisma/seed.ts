import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

// Reference dates relative to "now" so age-based rules behave correctly
const now = new Date();
const daysAgo = (n: number): Date => {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
};

const disputes = [
  // --- unauthorized_transaction: high amount → escalate_to_fraud ---
  {
    disputeRef: 'DSP-20260623-A1B2',
    customerName: 'Jane Smith',
    transactionRef: 'TXN-2026-001',
    paymentType: 'card_transaction',
    issueCategory: 'unauthorized_transaction',
    transactionStatus: 'completed',
    amount: 750.0,
    transactionDate: daysAgo(5),
    description: 'Customer did not authorise this transaction.',
    recommendedAction: 'escalate_to_fraud',
    disputeStatus: 'open',
  },
  // --- unauthorized_transaction: low amount → manual_review ---
  {
    disputeRef: 'DSP-20260623-C3D4',
    customerName: 'Robert Patel',
    transactionRef: 'TXN-2026-002',
    paymentType: 'card_transaction',
    issueCategory: 'unauthorized_transaction',
    transactionStatus: 'completed',
    amount: 49.99,
    transactionDate: daysAgo(3),
    description: 'Small unrecognised charge on statement.',
    recommendedAction: 'manual_review',
    disputeStatus: 'open',
  },
  // --- duplicate_charge + completed → auto_refund ---
  {
    disputeRef: 'DSP-20260623-E5F6',
    customerName: 'Sarah O\'Brien',
    transactionRef: 'TXN-2026-003',
    paymentType: 'card_transaction',
    issueCategory: 'duplicate_charge',
    transactionStatus: 'completed',
    amount: 120.0,
    transactionDate: daysAgo(10),
    description: 'Charged twice for the same purchase.',
    recommendedAction: 'auto_refund',
    disputeStatus: 'resolved',
  },
  // --- failed_transfer + failed → contact_customer ---
  {
    disputeRef: 'DSP-20260623-G7H8',
    customerName: 'Michael Chen',
    transactionRef: 'TXN-2026-004',
    paymentType: 'bank_transfer',
    issueCategory: 'failed_transfer',
    transactionStatus: 'failed',
    amount: 2500.0,
    transactionDate: daysAgo(7),
    description: 'Bank transfer failed but funds were debited.',
    recommendedAction: 'contact_customer',
    disputeStatus: 'open',
  },
  // --- missing_payment: old (> 30 days) → escalate_to_fraud ---
  {
    disputeRef: 'DSP-20260623-J9K2',
    customerName: 'Angela Foster',
    transactionRef: 'TXN-2026-005',
    paymentType: 'direct_debit',
    issueCategory: 'missing_payment',
    transactionStatus: 'pending',
    amount: 350.0,
    transactionDate: daysAgo(45),
    description: 'Direct debit collected but payment not received by payee.',
    recommendedAction: 'escalate_to_fraud',
    disputeStatus: 'escalated',
  },
  // --- missing_payment: recent (<= 30 days) → manual_review ---
  {
    disputeRef: 'DSP-20260623-L3M4',
    customerName: 'Thomas Nguyen',
    transactionRef: 'TXN-2026-006',
    paymentType: 'direct_debit',
    issueCategory: 'missing_payment',
    transactionStatus: 'pending',
    amount: 175.0,
    transactionDate: daysAgo(15),
    description: 'Payment collected but not showing on payee account.',
    recommendedAction: 'manual_review',
    disputeStatus: 'open',
  },
  // --- incorrect_amount → manual_review ---
  {
    disputeRef: 'DSP-20260623-N5P6',
    customerName: 'Laura Brennan',
    transactionRef: 'TXN-2026-007',
    paymentType: 'standing_order',
    issueCategory: 'incorrect_amount',
    transactionStatus: 'completed',
    amount: 900.0,
    transactionDate: daysAgo(2),
    description: 'Standing order paid £900 instead of the agreed £90.',
    recommendedAction: 'manual_review',
    disputeStatus: 'open',
  },
  // --- bank_transfer / unauthorized / high → escalate_to_fraud ---
  {
    disputeRef: 'DSP-20260623-Q7R8',
    customerName: 'David Kim',
    transactionRef: 'TXN-2026-008',
    paymentType: 'bank_transfer',
    issueCategory: 'unauthorized_transaction',
    transactionStatus: 'completed',
    amount: 5000.0,
    transactionDate: daysAgo(1),
    description: 'Large unauthorised outbound transfer. Possible account compromise.',
    recommendedAction: 'escalate_to_fraud',
    disputeStatus: 'escalated',
  },
  // --- standing_order / incorrect_amount → manual_review, resolved ---
  {
    disputeRef: 'DSP-20260623-S9T2',
    customerName: 'Emma Wilson',
    transactionRef: 'TXN-2026-009',
    paymentType: 'standing_order',
    issueCategory: 'incorrect_amount',
    transactionStatus: 'completed',
    amount: 55.0,
    transactionDate: daysAgo(20),
    description: 'Monthly standing order amount changed without customer consent.',
    recommendedAction: 'manual_review',
    disputeStatus: 'resolved',
  },
  // --- direct_debit / duplicate_charge → auto_refund, reopened ---
  {
    disputeRef: 'DSP-20260623-V3W4',
    customerName: 'Carlos Mendez',
    transactionRef: 'TXN-2026-010',
    paymentType: 'direct_debit',
    issueCategory: 'duplicate_charge',
    transactionStatus: 'completed',
    amount: 210.0,
    transactionDate: daysAgo(8),
    description: 'Direct debit collected twice in the same billing period.',
    recommendedAction: 'auto_refund',
    disputeStatus: 'reopened',
  },
];

async function main(): Promise<void> {
  console.log('🌱  Seeding database…');

  // Enable WAL mode to reduce SQLite locking conflicts
  // PRAGMA returns a result row, so use $queryRawUnsafe instead of $executeRawUnsafe
  await db.$queryRawUnsafe('PRAGMA journal_mode=WAL;');

  // Clear existing data in dependency order
  await db.disputeStatusHistory.deleteMany();
  await db.dispute.deleteMany();

  for (const data of disputes) {
    const dispute = await db.dispute.create({ data });

    // Seed an initial status history entry for every dispute
    await db.disputeStatusHistory.create({
      data: {
        disputeId: dispute.id,
        status: dispute.disputeStatus,
        reason: 'Initial dispute submission',
      },
    });

    // Add a second history entry for non-open disputes to show history
    if (dispute.disputeStatus === 'resolved') {
      await db.disputeStatusHistory.create({
        data: {
          disputeId: dispute.id,
          status: 'resolved',
          reason: 'Resolved after investigation',
        },
      });
    } else if (dispute.disputeStatus === 'escalated') {
      await db.disputeStatusHistory.create({
        data: {
          disputeId: dispute.id,
          status: 'escalated',
          reason: 'Escalated to fraud team for review',
        },
      });
    } else if (dispute.disputeStatus === 'reopened') {
      await db.disputeStatusHistory.create({
        data: {
          disputeId: dispute.id,
          status: 'resolved',
          reason: 'Initially resolved',
        },
      });
      await db.disputeStatusHistory.create({
        data: {
          disputeId: dispute.id,
          status: 'reopened',
          reason: 'Customer challenged the resolution',
        },
      });
    }
  }

  console.log(`✅  Seeded ${disputes.length} disputes with status history.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
