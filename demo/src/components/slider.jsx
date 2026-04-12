const Slider = ({value, min = 0, max = 100, onChange, ...props}) => {

    const percent = ((value - min) / (max - min)) * 100 + '%'

    return (
        <div className='slider-container' style={{'--progress': `${percent}`}}>
        <div className='slider-track'>
            <div className='slider-fill'/>
            <div className='slider-thumb'/>
        </div>

        <input
            onChange={(e) => onChange(Number(e.target.value))}
            className='rac-demo-checkbox'
            value={value}
            type='range'
            {...props}
            min={min}
            max={max}
        />
        </div>
    )
}

export default Slider