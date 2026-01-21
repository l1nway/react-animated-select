export const shake = (el) => {
  if (!el) return

  el.classList.remove('--animated-error')
  void el.offsetWidth
  el.classList.add('--animated-error')
}

export const clearShake = (el) => {
  el?.classList.remove('--animated-error')
}