import PropTypes from 'prop-types';

export const string = PropTypes.string;
export const bool = PropTypes.bool;
export const object = PropTypes.object;
export const array = PropTypes.array;
export const number = PropTypes.number;
export const func = PropTypes.func;
export const any = PropTypes.any;

const DataField = PropTypes.shape({
  field: string,
  weight: number
});

export const dataField = PropTypes.oneOfType([
  string,
  PropTypes.arrayOf(PropTypes.oneOfType([string, DataField]))
]);

export const reactType = PropTypes.oneOfType([
  string,
  PropTypes.arrayOf(string),
  object,
  PropTypes.arrayOf(object)
]);

export const react = PropTypes.shape({
  and: reactType,
  or: reactType,
  not: reactType
});

export const position = PropTypes.oneOf(['left', 'right']);

export const suggestions = PropTypes.arrayOf(object);

export const highlightField = PropTypes.oneOfType([
  string,
  PropTypes.arrayOf(string)
]);

export const queryFormat = PropTypes.oneOf(['and', 'or']);

export const fuzziness = PropTypes.oneOf([0, 1, 2, 'AUTO']);

export const title = PropTypes.oneOfType([string, any]);

export const wholeNumber = function(props, propName, componentName) {
  if (typeof props[propName] != 'number' || props[propName] < 0) {
    return new Error(
      `Invalid type of ${propName} supplied to ${componentName}. Validation failed`
    );
  }
};

export const appbaseConfig = PropTypes.shape({
  recordAnalytics: bool,
  enableQueryRules: bool,
  userId: string,
  customEvents: object
});

export const dataFieldValidator = (props, propName, componentName) => {
  const requiredError = new Error(
    `${propName} supplied to ${componentName} is required. Validation failed.`
  );
  const propValue = props[propName];
  if (!props.enableAppbase) {
    if (!propValue) return requiredError;
    if (typeof propValue !== 'string' && !Array.isArray(propValue)) {
      return new Error(
        `Invalid ${propName} supplied to ${componentName}. Validation failed.`
      );
    }
    if (Array.isArray(propValue) && propValue.length === 0)
      return requiredError;
  }
};