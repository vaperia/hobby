import PageLayout from "../components/PageLayout";

const buyerFaqs = [
  {
    question: "How do I buy a product?",
    answer:
      "Browse products, open the product details page, add the item to your cart, then proceed to checkout.",
  },
  {
    question: "How do I choose between self collection and standard delivery?",
    answer:
      "During checkout, you can choose from the delivery methods supported by the seller. Some products may only support one method.",
  },
  {
    question: "Where can I track my order?",
    answer:
      "Go to My Orders from the navigation bar. You can view your order status, items purchased, and total amount there.",
  },
  {
    question: "Can I change the order status myself?",
    answer:
      "No. Buyers can only view order status. The seller updates the order status after receiving and processing the order.",
  },
  {
    question: "What does self collection mean?",
    answer:
      "Self collection means you will arrange with the seller to collect the item directly instead of having it delivered.",
  },
];

const sellerFaqs = [
  {
    question: "How do I create a listing?",
    answer:
      "Go to Seller Dashboard and click Create New Listing. Fill in the product details, upload an image, choose delivery methods, then submit.",
  },
  {
    question: "How do I choose delivery methods for my product?",
    answer:
      "When creating or editing a listing, select Self Collection, Standard Delivery, or both under Available Delivery Methods.",
  },
  {
    question: "Where do I see customer orders?",
    answer:
      "Go to Seller Dashboard. Recent customer orders will appear under the Recent Orders section.",
  },
  {
    question: "How do I update an order status?",
    answer:
      "In Seller Dashboard, use the status dropdown beside each order. You can update it to confirmed, preparing, shipped, completed, ready for collection, collected, or cancelled.",
  },
  {
    question: "Why is low stock shown on my dashboard?",
    answer:
      "Low stock counts listings where stock is more than 0 but equal to or below 5. This helps sellers know which products may need restocking.",
  },
];

const generalFaqs = [
  {
    question: "What is HobbyHub?",
    answer:
      "HobbyHub is a marketplace for hobby items such as TCG products, figurines, albums, and accessories.",
  },
  {
    question: "Can I be both a buyer and seller?",
    answer:
      "Currently, seller features are available to accounts with seller or admin role. Buyer features are available to normal logged-in users.",
  },
  {
    question: "What should I do if checkout fails?",
    answer:
      "Check that your cart is not empty, you are logged in, and the selected delivery method is supported by all items in your cart.",
  },
];

function FaqCard({ question, answer }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900">{question}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
    </div>
  );
}

function FaqSection({ title, description, faqs }) {
  return (
    <section className="mt-10">
      <div>
        <h2 className="text-2xl font-black text-slate-900">{title}</h2>
        <p className="mt-2 text-slate-500">{description}</p>
      </div>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        {faqs.map((faq) => (
          <FaqCard key={faq.question} {...faq} />
        ))}
      </div>
    </section>
  );
}

export default function Help() {
  return (
    <PageLayout>
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-r from-purple-800 via-blue-700 to-sky-500 p-10 text-white shadow-md">
          <h1 className="text-4xl font-black">Help Center</h1>

          <p className="mt-3 max-w-3xl text-white/90">
            Find answers about buying, selling, delivery methods, checkout, and
            order management on HobbyHub.
          </p>
        </div>

        <FaqSection
          title="Buyer FAQ"
          description="For users who are browsing, buying, checking out, and tracking orders."
          faqs={buyerFaqs}
        />

        <FaqSection
          title="Seller FAQ"
          description="For sellers who are listing products and managing received orders."
          faqs={sellerFaqs}
        />

        <FaqSection
          title="General FAQ"
          description="Common platform questions."
          faqs={generalFaqs}
        />
      </main>
    </PageLayout>
  );
}