/**
 * What the plan card prints for the interval values the column can actually hold.
 *
 * The price suffix used to be `interval === "MONTHLY" ? "/mo" : "/yr"`. That is
 * a fail-open ternary on a money figure: `Subscription.interval` is a plain
 * String column with no DB constraint, and Stripe's own vocabulary for the same
 * idea is "month"/"year". A row holding Stripe's spelling rendered a $79/month
 * Business plan as "$79/yr" — the customer was told they pay twelve times less
 * than they do, on the one screen that exists to answer that question.
 *
 * An interval we do not recognise prints no period at all. "$79" is incomplete;
 * "$79/yr" is wrong.
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanCard } from "../plan-card";

function renderCard(interval: string) {
  render(
    <PlanCard
      planId="BUSINESS"
      name="Business"
      priceMinor={7900}
      interval={interval}
      currency="usd"
      features={["50 sites"]}
      isCurrent
    />
  );
}

describe("PlanCard price interval", () => {
  it.each([
    ["MONTHLY", "$79/mo"],
    ["YEARLY", "$79/yr"],
  ])("prints %s as %s", (interval, expected) => {
    renderCard(interval);
    expect(screen.getByText(expected)).toBeTruthy();
  });

  // Stripe's own vocabulary — what lands in the column if any writer ever
  // stores `price.recurring.interval` straight through.
  it.each([
    ["month", "$79/mo"],
    ["year", "$79/yr"],
  ])("prints Stripe's %s as %s", (interval, expected) => {
    renderCard(interval);
    expect(screen.getByText(expected)).toBeTruthy();
  });

  it("is case- and whitespace-insensitive", () => {
    renderCard(" Monthly ");
    expect(screen.getByText("$79/mo")).toBeTruthy();
  });

  it("prints no period for an interval it cannot identify", () => {
    renderCard("quarterly");
    expect(screen.getByText("$79")).toBeTruthy();
    expect(screen.queryByText("$79/yr")).toBeNull();
    expect(screen.queryByText("$79/mo")).toBeNull();
  });
});
