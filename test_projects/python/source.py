KONSTANT = "KONSTANT"


def funktion(value):
    print(value)


class Klass:
    def method(self):
        funktion(KONSTANT)


Klass().method()
