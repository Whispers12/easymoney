import { bind } from "../bind";
import {
  currencies,
  createCurrencyList,
  CurrencyList,
  CurrencyUnitISO
} from "./../currencies/";
import { MoneyIntlOptions, MoneyIntlFormatter } from "./types";
import { MoneyBase } from "../money";
import { lpad } from "./lpad";

type PrivateInstance = {
  currencyList: CurrencyList<CurrencyUnitISO>;
};

export function createIntlFormatterFactory(
  currencyList: CurrencyList<CurrencyUnitISO>
) {
  const privateInstance = { currencyList };

  const publicInstance = {
    format: bind(format, privateInstance)
  } as MoneyIntlFormatter;

  return publicInstance;
}

export function createMoneyIntlFormatterUnit(currencies: CurrencyUnitISO[]) {
  const currencyList = createCurrencyList(currencies);

  return createIntlFormatterFactory.bind(null, currencyList);
}

const defaultOptions: MoneyIntlOptions = {
  currencyDisplay: "symbol",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
  useGrouping: true,
  style: "currency"
};

function format(
  privateInstance: PrivateInstance,
  money: MoneyBase,
  locale: string = "en-US",
  options: MoneyIntlOptions = defaultOptions
) {
  let valueBase = money.getAmount();
  let negative = false;

  if (valueBase[0] === "-") {
    negative = true;
    valueBase = valueBase.slice(1);
  }

  const subunit = privateInstance.currencyList.subUnitFor(money.getCurrency());
  const valueLength = valueBase.length;

  let formatted: string;
  let decimalDigitsLength;
  if (valueLength > subunit) {
    formatted = valueBase.slice(0, valueLength - subunit);
    const decimalDigits = valueBase.slice(valueLength - subunit);

    decimalDigitsLength = decimalDigits.length;
    if (decimalDigitsLength > 0) {
      formatted = `${formatted}.${decimalDigits}`;
    }
  } else {
    const zeros = lpad("", "0", subunit - valueLength);
    formatted = `0.${zeros}${valueBase}`;
  }

  if (negative === true) {
    formatted = `-${formatted}`;
  }

  // @ts-ignore
  return Number(formatted).toLocaleString(locale, {
    currency: money.getCurrency(),
    useGrouping: options.useGrouping,
    style: options.style,
    currencyDisplay: options.currencyDisplay,
    minimumFractionDigits: options.minimumFractionDigits || decimalDigitsLength,
    maximumFractionDigits: options.maximumFractionDigits || decimalDigitsLength
  });
}
