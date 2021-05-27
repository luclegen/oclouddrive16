class Helper {
  constructor() {
    this.firstNamePattern = '^[A-Z]{1}[a-z]*$'
    this.lastNamePattern = '^[A-Z]{1}[a-z]*(?: [A-Z]{1}[a-z]*)*(?: [A-Z]{1}[a-z]*)?$'
    this.emailPattern = '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$'
  }

  isFirstName = value => RegExp(this.firstNamePattern).test(value)

  isLastName = value => RegExp(this.lastNamePattern).test(value)

  isEmail = value => RegExp(this.emailPattern).test(value)

  isDate = (y, m, d, date = new Date(parseInt(m) + 1 + '/' + d + '/' + y)) => date.getFullYear() === parseInt(y) && date.getMonth() === parseInt(m) && date.getDate() === parseInt(d)

  checkPassword = value => {
    let count = 0
    const strength = Object.freeze({
      0: 'Worst',
      1: 'Bad',
      2: 'Weak',
      3: 'Good',
      4: 'Strong'
    })

    if (value.length >= 8) count++
    if (/[a-z]/ig.test(value)) count++
    if (/\d/g.test(value)) count++
    if (/[.@#$%^&*(),.?":{}|<>]/g.test(value)) count++

    return {
      isStrong: count === 4,
      level: count,
      strength: strength[count]
    }
  }
}

export default new Helper()