export const SvgIconBorder: React.FC<{size: number}> = ({size}) => (
  <svg
    style={{float: 'right', marginRight: '-' + size / 4 + 'px'}}
    width={size}
    viewBox="-6 -6 36.00 36.00"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g>
      <path
        d="M10 3C12.2415 5.33579 13.6191 8.50702 13.6191 12C13.6191 15.493 12.2415 18.6642 10 21"
        stroke="var(--color_inside-accent)"
        strokeWidth="2"
        strokeLinecap="round"
      ></path>
    </g>
  </svg>
);

export const SvgIconLineArrowDown: React.FC<any> = (props) => {
  return (
    <svg fill="currentColor" viewBox="-2.4 -2.4 28.80 28.80" {...props}>
      <g>
        <path d="M15.29,16.29,13,18.59V7a1,1,0,0,0-2,0V18.59l-2.29-2.3a1,1,0,1,0-1.42,1.42l4,4a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l4-4a1,1,0,0,0-1.42-1.42ZM19,2H5A1,1,0,0,0,5,4H19a1,1,0,0,0,0-2Z"></path>
      </g>
    </svg>
  );
};

export const SvgIconArrowUpLine: React.FC<any> = (props) => {
  return (
    <SvgIconLineArrowDown transform="matrix(-1, 0, 0, -1, 0, 0)" {...props} />
  );
};

export const SvgIconArrowDownLine: React.FC<any> = (props) => {
  return (
    <svg fill="currentColor" viewBox="-2.4 -2.4 28.80 28.80" {...props}>
      <g>
        <path d="M19,20H5a1,1,0,0,0,0,2H19a1,1,0,0,0,0-2Zm-7.71-2.29a1,1,0,0,0,.33.21.94.94,0,0,0,.76,0,1,1,0,0,0,.33-.21l4-4a1,1,0,0,0-1.42-1.42L13,14.59V3a1,1,0,0,0-2,0V14.59l-2.29-2.3a1,1,0,1,0-1.42,1.42Z"></path>
      </g>
    </svg>
  );
};

export const SvgIconLineArrowUp: React.FC<any> = (props) => {
  return (
    <SvgIconArrowDownLine transform="matrix(-1, 0, 0, -1, 0, 0)" {...props} />
  );
};
