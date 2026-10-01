import {PawPrint} from 'lucide-react'

function Author() {

    return (
        <article
            className='rac-author'
            id='author'
        >
            
            <div className='rac-code-title-container'>
                <div className='rac-code-icon'>
                    <PawPrint/>
                </div>
                <h3 className='rac-code-title'>
                    Author
                </h3>
            </div>
        </article>
    )
}
export default Author